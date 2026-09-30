"use client"

import Image from "next/image";

export default function DemoApp(){
    return (
        <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden bg-black">
            <Image
                src="/landing-demo.png"
                alt="Narrativee brand direction demo"
                fill
                sizes="100vw"
                className="object-cover"
            />
        </div>
    )
}
