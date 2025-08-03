import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { parseLocationUrl, buildLocationUrl } from './locationUtils';

/**
 * Hook for managing location URL state with area support
 */
export function useLocationUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getCurrentLocation = useCallback(() => {
    const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    if (!fullPath) return { locationKey: '', areaId: undefined };
    return parseLocationUrl(fullPath);
  }, [pathname, searchParams]);

  const navigateToLocation = useCallback(
    (locationKey: string, areaId?: string, replace: boolean = false) => {
      const url = buildLocationUrl(locationKey, areaId);
      if (replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [router],
  );

  const navigateToArea = useCallback(
    (areaId: string) => {
      const { locationKey } = getCurrentLocation();
      navigateToLocation(locationKey, areaId, true);
    },
    [getCurrentLocation, navigateToLocation],
  );

  const clearArea = useCallback(() => {
    const { locationKey } = getCurrentLocation();
    navigateToLocation(locationKey, undefined, true);
  }, [getCurrentLocation, navigateToLocation]);

  return {
    getCurrentLocation,
    navigateToLocation,
    navigateToArea,
    clearArea,
  };
}

/**
 * Hook for managing consolidated location state
 */
export function useConsolidatedLocationState(locationData?: any) {
  const { getCurrentLocation, navigateToArea, clearArea } = useLocationUrlState();
  const { areaId } = getCurrentLocation();

  const currentArea = locationData?.areas?.find((area: any) => area.id === areaId);
  const isMainArea = !areaId || areaId === 'main';

  const setActiveArea = useCallback(
    (newAreaId: string) => {
      if (newAreaId === 'main') {
        clearArea();
      } else {
        navigateToArea(newAreaId);
      }
    },
    [navigateToArea, clearArea],
  );

  return {
    currentAreaId: areaId,
    currentArea,
    isMainArea,
    setActiveArea,
    availableAreas: locationData?.areas || [],
  };
}

/**
 * Generate breadcrumb data for consolidated locations
 */
export function generateLocationBreadcrumbs(
  locationKey: string,
  locationDisplayName: string,
  areaId?: string,
  areaDisplayName?: string,
) {
  const breadcrumbs = [
    { label: 'Locations', href: '/locations' },
    { label: locationDisplayName, href: buildLocationUrl(locationKey) },
  ];

  if (areaId && areaDisplayName && areaId !== 'main') {
    breadcrumbs.push({
      label: areaDisplayName,
      href: buildLocationUrl(locationKey, areaId),
    });
  }

  return breadcrumbs;
}

/**
 * Create area navigation data for tabs/navigation
 */
export function createAreaNavigation(locationData: any, currentAreaId?: string) {
  if (!locationData?.areas) return [];

  const navigation = [
    {
      id: 'main',
      label: 'Overview',
      active: !currentAreaId || currentAreaId === 'main',
      href: buildLocationUrl(locationData.name),
    },
  ];

  locationData.areas.forEach((area: any) => {
    navigation.push({
      id: area.id,
      label: area.displayName,
      active: currentAreaId === area.id,
      href: buildLocationUrl(locationData.name, area.id),
    });
  });

  return navigation;
}
