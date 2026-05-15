import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'business economy';

  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NewsData API key not configured' }, { status: 500 });
  }

  try {
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en&category=business,politics,technology&size=5`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache for 5 mins
    
    if (!res.ok) {
      throw new Error(`NewsData API error: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Map to a clean shape for the frontend
    const articles = (data.results || []).map((article: any) => ({
      title: article.title,
      description: article.description,
      source: article.source_name,
      pubDate: article.pubDate,
      link: article.link,
    }));

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
