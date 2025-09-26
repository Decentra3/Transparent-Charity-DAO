'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { User, Wallet, Sun, Moon, ChevronDown, Target, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';
import { useOnchainStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';

export function Header() {
  const pathname = usePathname();
  const { isConnected, displayAddress, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const isDaoMember = useOnchainStore((s) => s.isDaoMember);
  const hasDonorSbt = useOnchainStore((s) => s.hasDonorSbt);
  const { theme, toggleTheme } = useTheme();
  const [isProjectsHovered, setIsProjectsHovered] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Donate', href: '/donate' },
    { name: 'Request Help', href: '/request' },
    ...(isConnected ? [{ name: 'Vote', href: '/vote' }] : []),
  ];

  const projectsSubmenu = [
    { name: 'Request Funds', href: '/projects/requests', icon: Target },
    { name: 'Crowdfunding', href: '/projects/crowdfunding', icon: Heart },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-[hsl(var(--background))]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-md" />
            <span className="text-xl font-bold text-foreground">
              TCD
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                pathname === '/dashboard'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              Dashboard
            </Link>

            {/* Projects with submenu */}
            <div 
              className="relative"
              onMouseEnter={() => setIsProjectsHovered(true)}
              onMouseLeave={() => setIsProjectsHovered(false)}
            >
              <Link
                href="/projects"
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1',
                  pathname.startsWith('/projects')
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                Projects
                <ChevronDown className="h-3 w-3" />
              </Link>
              
              {/* Submenu with improved spacing */}
              {isProjectsHovered && (
                <div className="absolute top-[120%] left-0 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                  {/* Invisible bridge to prevent gap */}
                  <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent"></div>
                  
                  {projectsSubmenu.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                          pathname === item.href
                            ? 'text-primary bg-accent'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Other navigation items */}
            {navigation.slice(1).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-foreground hover:text-primary"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {isConnected ? (
              <div className="flex items-center space-x-3">
                <Link href="/profile" className="hidden sm:flex items-center space-x-2 text-foreground hover:text-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{displayAddress || 'Connected'}</span>
                </Link>
                {isDaoMember && (
                  <Badge className="hidden sm:inline-flex bg-transparent text-primary border-border">
                    DAO
                  </Badge>
                )}
                {hasDonorSbt && (
                  <Badge className="hidden sm:inline-flex bg-transparent text-primary border-border">
                    DONOR
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="text-primary" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
