import {
  Compass,
  Brain,
  Code2,
  Sliders,
  Clock,
  Network,
  LayoutDashboard,
  GraduationCap,
} from 'lucide-react';

export const navItems = [
  { id: 'home', label: 'Home', icon: GraduationCap },
  { id: 'careers', label: 'Career Guidance', icon: Compass },
  { id: 'practice', label: 'DSA Practice', icon: Code2 },
  { id: 'simulator', label: 'Simulator', icon: Sliders, badge: 'Flagship' },
  { id: 'optimizer', label: 'Optimizer', icon: Clock, badge: 'Knapsack' },
  { id: 'learning', label: 'Learning Path', icon: Brain },
  { id: 'graph', label: 'Knowledge Graph', icon: Network },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'Student Profile', icon: GraduationCap },
];
