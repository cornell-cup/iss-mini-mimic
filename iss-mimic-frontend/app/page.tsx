import Image from "next/image";
import ISSDataExtended from "@/components/ISSDataExtended";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">ISS Telemetry Monitor</h1>
        <p className="text-gray-600 dark:text-gray-400">Real-time data from the International Space Station</p>
      </header>
      
      {/* ISS Telemetry Data Component */}
      <div className="w-full mb-8">
        <ISSDataExtended />
      </div>
      
      <footer className="mt-10 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={25}
            priority
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by Next.js and Lightstreamer
          </p>
        </div>
      </footer>
    </div>
  );
}
