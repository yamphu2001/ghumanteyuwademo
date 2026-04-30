import { redirect } from 'next/navigation';

export default function NotFound() {
  // Use a permanent redirect (308) or temporary (307)
  // Most "Catch-all" redirects should be temporary
  redirect('/landing');
}
