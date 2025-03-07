import { NextRequest, NextResponse } from 'next/server';

// 驗證 URL 是否有效
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// 驗證圖片 URL 是否有效
async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return response.ok && contentType?.startsWith('image/') || false;
  } catch (e) {
    // 只在開發環境中輸出日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('圖片 URL 驗證錯誤:', e);
    }
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    try {
      // 設置超時時間為 10 秒
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // 簡單的標題提取
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // 提取 favicon
      let favicon = '';
      
      // 嘗試從 link 標籤中提取 favicon
      const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
      if (faviconMatch) {
        favicon = faviconMatch[1];
        // 只在開發環境中輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('從 HTML 中提取到 favicon:', favicon);
        }
        // 如果 favicon 是相對路徑，轉換為絕對路徑
        if (favicon.startsWith('/')) {
          const urlObj = new URL(url);
          favicon = `${urlObj.protocol}//${urlObj.host}${favicon}`;
          // 只在開發環境中輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.log('轉換為絕對路徑後的 favicon:', favicon);
          }
        } else if (!favicon.startsWith('http')) {
          // 處理相對路徑但不以 / 開頭的情況
          const urlObj = new URL(url);
          const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
          favicon = `${urlObj.protocol}//${urlObj.host}${basePath}${favicon}`;
          // 只在開發環境中輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.log('處理相對路徑後的 favicon:', favicon);
          }
        }
        
        // 驗證 favicon URL 是否有效
        if (!isValidUrl(favicon)) {
          // 只在開發環境中輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.log('無效的 favicon URL:', favicon);
          }
          favicon = '';
        } else {
          // 驗證圖片 URL 是否可訪問
          try {
            const isValid = await isValidImageUrl(favicon);
            if (!isValid) {
              // 只在開發環境中輸出日誌
              if (process.env.NODE_ENV === 'development') {
                console.log('無法訪問的 favicon URL:', favicon);
              }
              favicon = '';
            } else {
              // 只在開發環境中輸出日誌
              if (process.env.NODE_ENV === 'development') {
                console.log('有效的 favicon URL:', favicon);
              }
            }
          } catch (e) {
            // 只在開發環境中輸出日誌
            if (process.env.NODE_ENV === 'development') {
              console.log('驗證 favicon URL 時出錯:', e);
            }
            favicon = '';
          }
        }
      }
      
      // 如果沒有找到 favicon 或 favicon 無效，使用 Google Favicon 服務
      if (!favicon) {
        const domain = new URL(url).hostname;
        favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        // 只在開發環境中輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('使用 Google Favicon 服務:', favicon);
        }
      }
      
      const metadata = {
        title: title || new URL(url).hostname,
        logo: favicon,
        url
      };
      
      return NextResponse.json(metadata);
    } catch (error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout', details: 'The request took too long to complete' },
          { status: 408 }
        );
      }
      
      // 嘗試使用 Google Favicon 服務作為備用
      try {
        const domain = new URL(url).hostname;
        const fallbackMetadata = {
          title: domain,
          logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          url: url
        };
        // 只在開發環境中輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('使用備用 Google Favicon 服務:', fallbackMetadata.logo);
        }
        return NextResponse.json(fallbackMetadata);
      } catch (fallbackError) {
        throw error; // 重新拋出原始錯誤
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metadata', details: (error as Error).message },
      { status: 500 }
    );
  }
} 