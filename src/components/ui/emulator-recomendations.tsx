import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Shield, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function EmulatorRecommendations() {
  const recommendedEmulators = [
    {
      name: 'mGBA',
      platform: 'PC',
      description: 'Most popular, no known incompatibilities',
      image: '/mgba.png',
      link: 'https://mgba.io/',
      badge: 'Popular',
    },
    {
      name: 'SameBoy',
      platform: 'PC/iOS',
      description: 'Most accurate emulator available',
      image: '/sameboy.png',
      link: 'https://sameboy.github.io/',
      badge: 'Most Accurate',
    },
    {
      name: 'BGB',
      platform: 'PC',
      description: 'Used by developers, powerful debugger',
      image: '/bgb.png',
      link: 'https://bgb.bircd.org/',
      badge: 'Developer Choice',
    },
    {
      name: 'RetroArch',
      platform: 'Android',
      description: 'Use SameBoy or Gambatte core',
      image: '/retroarch.svg',
      link: 'https://www.retroarch.com/',
      badge: 'Mobile',
    },
  ];

  const avoidEmulators = [
    { name: 'VBA', reason: 'Not updated since 2004' },
    { name: 'VBA-M', reason: 'Extremely inaccurate' },
  ];

  return (
    <div className="">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-6 w-6 text-green-600" />
          <h2 className="text-3xl font-bold">Recommended Emulators</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose from these tested emulators to ensure the best Polished Crystal experience. We only
          provide support for issues reproducible on these emulators or official hardware.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {recommendedEmulators.map((emulator) => (
          <Card key={emulator.name} className="relative group hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 relative">
                <Image
                  src={emulator.image || '/placeholder.svg'}
                  alt={`${emulator.name} logo`}
                  width={64}
                  height={64}
                  className="rounded-lg"
                />
                <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                  {emulator.badge}
                </Badge>
              </div>
              <CardTitle className="text-lg">{emulator.name}</CardTitle>
              <CardDescription className="">
                <Badge variant="default" className="text-xs">
                  {emulator.platform}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="">
              <p className="text-sm text-muted-foreground mb-4 text-center">
                {emulator.description}
              </p>
              <Button asChild className="w-full" size="sm">
                <Link href={emulator.link} target="_blank" className="flex items-center gap-2">
                  Download
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Emulators to Avoid
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {avoidEmulators.map((emulator) => (
            <div
              key={emulator.name}
              className="flex items-center gap-3 p-3 bg-white dark:bg-black/30 rounded-md"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">{emulator.name}</div>
                <div className="text-xs text-muted-foreground">{emulator.reason}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Using unsupported emulators may result in compatibility issues and no technical support.
        </p>
      </div>


    </div>
  );
}
