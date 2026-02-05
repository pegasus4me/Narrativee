"use client"
import { useRouter } from "next/navigation";
import Header from "./components/commons/Header";

export default function Home() {
  const router = useRouter();

  return (
    <div className="bg-white">
      <Header />

      <main className=" max-w-[97%] mx-auto">
        <section className="relative flex flex-col items-center">
          {/* Centered heading at the top */}
          <div className="mt-16 md:mt-20 lg:mt-24 mb-12 z-10">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold font-manrope text-center px-4">
              Grow on <span className="bg-orange-500 rounded-xl px-5 text-white border-2 border-orange-200">Substack</span> <br />with auto mode
            </h1>
            <p className="text-center text-gray-600 mt-4 font-urbanist max-w-[90%] mx-auto">
              Narrativee helps you grow on Substack with AI-powered content generation and optimization.
            </p>
          </div>

        </section>
      </main>
    </div>
  );
}