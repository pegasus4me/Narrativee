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

    // Fetch the logo image
    const logoData = await fetch(new URL('../public/logo.png', import.meta.url)).then(
        (res) => res.arrayBuffer()
    )

    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 128,
                    background: 'linear-gradient(to bottom right, #ffffff, #fffbeb)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    position: 'relative'
                }}
            >
                {/* Decorative circle */}
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-10%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'rgba(251, 191, 36, 0.2)', // amber-400 with opacity
                    filter: 'blur(80px)',
                }} />

                <div style={{
                    position: 'absolute',
                    bottom: '-20%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.2)', // amber-500 with opacity
                    filter: 'blur(80px)',
                }} />


                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 10 }}>
                    {/* Logo Image */}
                    {/* @ts-ignore */}
                    <img src={logoData} width="100" height="100" style={{ objectFit: 'contain' }} />

                    <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: '-0.05em', color: '#111827' }}>
                        Narrativee
                    </div>
                </div>

                <div style={{
                    marginTop: 40,
                    fontSize: 40,
                    color: '#4b5563',
                    maxWidth: '800px',
                    textAlign: 'center',
                    lineHeight: 1.4,
                    fontWeight: 500,
                    zIndex: 10
                }}>
                    Turn data into narrative reports in minutes.
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
