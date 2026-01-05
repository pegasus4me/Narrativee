import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Image metadata
export const alt = 'Narrativee -  '
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
    // Fetch the static OG image
    const imageData = await fetch(new URL('../public/ogImage.png', import.meta.url)).then(
        (res) => res.arrayBuffer()
    )

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    background: '#f6f6f6',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* @ts-ignore */}
                <img src={imageData} width="1200" height="630" />
            </div>
        ),
        {
            ...size,
        }
    )
}
