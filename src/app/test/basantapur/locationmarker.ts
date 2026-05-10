export interface Landmark {
  id: string;
  name: string;
  coordinates: [number, number];
  type: string;
  image: string;
  description?: string;
}
export const landmarks: Landmark[] = [
  {
    id: 'm5',
    name: "Gaddhi Baithak",
    coordinates: [85.30670642753597, 27.703993890028734],
    type: 'ceremonial-hall',
    image: "/images/test/giddhi.png",
    description: "A neo-classical grand hall built during the Rana era, used for state ceremonies and welcoming foreign heads of state."
  },
  {
    id: 'm6',
    name: "Nasal Chowk",
    coordinates: [85.30744109611639, 27.704201772889295],
    type: 'courtyard',
    image: "/images/test/nasal.png",
    description: "The historic main courtyard of the palace used for royal coronations, featuring the sacred Dancing Shiva shrine."
  },
  {
    id: 'm7',
    name: "Tribhuvan Museum",
    coordinates: [85.30737296659538, 27.70429107648247],
    type: 'museum-wing',
    image: "/images/test/tri.png",
    description: "A memorial wing dedicated to King Tribhuvan, showcasing personal artifacts and the history of the 1951 democratic movement."
  },
  {
    id: 'm8',
    name: "Birendra Museum",
    coordinates: [85.30731191546846, 27.70407565102353],
    type: 'museum-wing',
    image: "/images/test/bir.png",
    description: "Exhibits items belonging to late King Birendra, including ornate coronation robes and diplomatic gifts from around the globe."
  },
  {
    id: 'm9',
    name: "Nine Storey Palace",
    coordinates: [85.30748646291916, 27.703884906223355],
    type: 'historic-tower',
    image: "/images/test/nine.png",
    description: "Also known as Basantapur Tower, this massive structure stands as a testament to Shah-era architecture with views over the valley."
  },
  {
    id: 'm10',
    name: "Lohan Chowk",
    coordinates: [85.30778448537261, 27.704031092053338],
    type: 'courtyard',
    image: "/images/test/lohan.png",
    description: "A central courtyard surrounded by four distinct towers, representing the unification of the four major kingdoms of the valley."
  },
  {
    id: 'm11',
    name: "Hanuman Dhoka Museum Art Gallery",
    coordinates: [85.3083862458749, 27.704045191963647],
    type: 'art-gallery',
    image: "/images/test/art.png",
    description: "A gallery housing significant stone inscriptions, religious sculptures, and artistic treasures from Nepal's medieval history."
  },
  {
    id: 'm12',
    name: "Square behind Taleju",
    coordinates: [85.30805863334852, 27.704066341828845],
    type: 'religious-square',
    image: "/images/test/taleju.png",
    description: "A peaceful square located behind the sacred Taleju Temple, often hosting ritualistic activities and local devotees."
  }
];