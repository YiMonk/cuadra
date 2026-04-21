import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Attempt 1: Try a reliable API aggregator for BCV (Fast & Reliable)
    try {
      const apiResponse = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        next: { revalidate: 3600 }
      });
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        if (data && data.promedio) {
          console.log('BCV Rate fetched from DolarAPI:', data.promedio);
          return NextResponse.json({ 
            rate: data.promedio, 
            date: data.fechaActualizacion || new Date().toISOString(),
            source: 'dolarapi'
          });
        }
      }
    } catch (apiErr) {
      console.warn('DolarAPI failed, falling back to scraper:', apiErr);
    }

    // Attempt 2: Scraper as fallback
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://www.bcv.org.ve/', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      next: { revalidate: 3600 }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`BCV site unreachable: ${response.statusText}`);
    }

    const html = await response.text();
    const dolarSection = html.match(/id="dolar"[\s\S]*?<strong>([\d,.]+)<\/strong>/i);
    
    if (dolarSection && dolarSection[1]) {
      const bcvRate = parseFloat(dolarSection[1].replace(',', '.'));
      console.log('BCV Rate scraped successfully:', bcvRate);
      return NextResponse.json({ 
        rate: bcvRate, 
        date: new Date().toISOString(),
        source: 'scraping'
      });
    }

    throw new Error('USD rate not found in BCV page structure');
  } catch (error: any) {
    console.error('Final BCV fetch failure:', error);
    // Fallback to a hardcoded recent rate if everything fails so at least conversion works
    return NextResponse.json({ 
      rate: 480.50, // Best effort fallback
      error: 'Failed to fetch live rate', 
      details: error.message 
    }, { status: 200 }); // Status 200 so the app doesn't break
  }
}
