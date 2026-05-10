"use client";

import { useRef, useState, useEffect } from 'react';
import maplibregl from 'maplibre-gl';

const neonColors = ['#00f2ff', '#00ff9d', '#ff0055', '#ffee00', '#7a00ff'];
const GRID_SIZE = 0.0001;

export function useMapSetup(mapContainer: React.RefObject<HTMLDivElement | null>) {
    const mapInstance = useRef<maplibregl.Map | null>(null);
    const playerMarker = useRef<maplibregl.Marker | null>(null);
    const capturedCells = useRef<GeoJSON.FeatureCollection>({
        type: 'FeatureCollection',
        features: [],
    });
    const visitedCellIds = useRef(new Set<string>());

    const [isLoaded, setIsLoaded] = useState(false);
    const [capturedCount, setCapturedCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(true);
    const isFollowingRef = useRef(true);

    useEffect(() => {
        isFollowingRef.current = isFollowing;
    }, [isFollowing]);

    useEffect(() => {
        if (!mapContainer.current) return;

        mapInstance.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://tiles.openfreemap.org/styles/liberty',
            center: [85.3072, 27.7042],
            zoom: 17,
            dragRotate: true,
        });

        const el = document.createElement('div');
        el.style.cssText = `
            width: 45px; 
            height: 45px; 
            background-image: url('/play/PlayerMarker/Mascot.png');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            pointer-events: none;
        `;

        playerMarker.current = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat([85.3072, 27.7042])
            .addTo(mapInstance.current);

        mapInstance.current.on('load', () => {
            if (!mapInstance.current) return;
            mapInstance.current.addSource('grid-source', {
                type: 'geojson',
                data: capturedCells.current,
            });
            mapInstance.current.addLayer({
                id: 'grid-layer',
                type: 'fill',
                source: 'grid-source',
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.4,
                },
            });
            setIsLoaded(true);
        });

        mapInstance.current.on('dragstart', () => {
            setIsFollowing(false);
            isFollowingRef.current = false;
        });

        return () => mapInstance.current?.remove();
    }, [mapContainer]);

    // Called on EVERY player move — always follows, always tracks cell
    const onPlayerMove = (lng: number, lat: number) => {
        // ── Camera follow (every move, not just new cells) ──
        if (isFollowingRef.current && mapInstance.current) {
            mapInstance.current.jumpTo({ center: [lng, lat] });
        }

        // ── Grid cell tracking ──
        const cellId = `${Math.floor(lng / GRID_SIZE)}_${Math.floor(lat / GRID_SIZE)}`;
        if (visitedCellIds.current.has(cellId)) return;

        visitedCellIds.current.add(cellId);
        const cellX = Math.floor(lng / GRID_SIZE);
        const cellY = Math.floor(lat / GRID_SIZE);

        capturedCells.current.features.push({
            type: 'Feature',
            properties: { color: neonColors[Math.floor(Math.random() * neonColors.length)] },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [cellX * GRID_SIZE, cellY * GRID_SIZE],
                    [(cellX + 1) * GRID_SIZE, cellY * GRID_SIZE],
                    [(cellX + 1) * GRID_SIZE, (cellY + 1) * GRID_SIZE],
                    [cellX * GRID_SIZE, (cellY + 1) * GRID_SIZE],
                    [cellX * GRID_SIZE, cellY * GRID_SIZE],
                ]],
            },
        });

        const src = mapInstance.current?.getSource('grid-source') as maplibregl.GeoJSONSource;
        if (src) src.setData(capturedCells.current);
        setCapturedCount(visitedCellIds.current.size);
    };

    const recenterOnPlayer = (playerPos: [number, number]) => {
        if (mapInstance.current) {
            mapInstance.current.easeTo({ center: playerPos, duration: 400 });
        }
        setIsFollowing(true);
        isFollowingRef.current = true;
    };

    return { mapInstance, playerMarker, isLoaded, capturedCount, onPlayerMove, isFollowing, recenterOnPlayer };
}