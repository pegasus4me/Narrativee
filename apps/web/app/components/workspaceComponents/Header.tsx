"use client"
import Image from "next/image";
import ProfileMenu from "../commons/ProfileMenu";

export default function WorkspaceHeader() {
    return (
        <header className="w-full h-fit bg-tertiary border-b px-4 md:px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-40">
            <div className="flex items-center gap-3 w-[100px] md:w-[130px]">
                <Image src="/logoWhite.png" alt="Logo" width={130} height={130} className="w-full h-auto" />
            </div>
            <ProfileMenu />
        </header>
    );
}