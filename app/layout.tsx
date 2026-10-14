import './globals.css';
import './refinements.css';
import './finishing.css';
import './sculpture.css';
import './workspace.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'NeuroTwin AI — A mind that’s uniquely yours', description: 'Explore your personalized brain-health digital twin. Cognitive wellness, sleep, activity, and stress in one place.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
