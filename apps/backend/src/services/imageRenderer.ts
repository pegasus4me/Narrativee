import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

let interFontData: Buffer | null = null;

export class ImageRenderer {
    /**
     * Loads the Inter font.
     */
    private static async getFont(): Promise<Buffer> {
        if (interFontData) return interFontData;

        // Fetch Inter font from Google Fonts (Regular)
        const response = await fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff');
        const arrayBuffer = await response.arrayBuffer();
        interFontData = Buffer.from(arrayBuffer);
        return interFontData;
    }

    /**
     * Renders a carousel slide into a PNG data URI.
     */
    static async renderCarouselSlide(
        text: string,
        backgroundUrl: string,
        slideNumber: number,
        totalSlides: number,
        aspectRatio: '1:1' | '4:5',
        isTitleSlide: boolean = false
    ): Promise<string> {
        const width = 1080;
        const height = aspectRatio === '4:5' ? 1350 : 1080;

        const fontData = await this.getFont();

        const svg = await satori(
            {
                type: 'div',
                props: {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#000000',
                        backgroundImage: `url(${backgroundUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '120px',
                    },
                    children: [
                        {
                            type: 'div',
                            props: {
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%',
                                    height: '100%',
                                },
                                children: [
                                    {
                                        type: 'h1',
                                        props: {
                                            style: {
                                                color: '#ffffff',
                                                fontSize: isTitleSlide ? '96px' : '72px',
                                                fontFamily: 'Inter',
                                                fontWeight: 700,
                                                textAlign: 'center',
                                                lineHeight: 1.3,
                                                textShadow: isTitleSlide ? '0 8px 24px rgba(0,0,0,0.9), 0 4px 8px rgba(0,0,0,0.8)' : '0 4px 16px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.8)',
                                            },
                                            children: text
                                        }
                                    }
                                ]
                            }
                        },
                        ...(isTitleSlide ? [] : [{
                            type: 'div',
                            props: {
                                style: {
                                    position: 'absolute',
                                    bottom: '60px',
                                    right: '60px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '32px',
                                    fontFamily: 'Inter',
                                    fontWeight: 600,
                                    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                                },
                                children: `${slideNumber} / ${totalSlides}`
                            }
                        }])
                    ]
                }
            } as any,
            {
                width,
                height,
                fonts: [
                    {
                        name: 'Inter',
                        data: fontData,
                        weight: 700,
                        style: 'normal',
                    }
                ],
            }
        );

        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: width },
            background: 'transparent',
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        return `data:image/png;base64,${pngBuffer.toString('base64')}`;
    }
}
