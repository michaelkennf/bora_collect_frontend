export async function reverseGeocodeProvince(latitude: number, longitude: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'fr',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const address = data?.address || {};

    return (
      address.state ||
      address.region ||
      address.province ||
      address.county ||
      address.city ||
      null
    );
  } catch (error) {
    console.error('Erreur reverse geocoding:', error);
    return null;
  }
}


