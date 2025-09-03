import Image from "next/image";
import ISSDataExtended from "@/components/ISSDataExtended";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="container py-4">
        <header className="pb-3 mb-4 text-center">
          <h1 className="fw-bold mb-2">ISS Telemetry Monitor</h1>
          <p className="text-secondary">Real-time data from the International Space Station</p>
        </header>
        
        {/* ISS Telemetry Data Component */}
        <div className="row mb-4">
          <div className="col">
            <ISSDataExtended />
          </div>
        </div>
        
        <footer className="pt-3 mt-4 text-center border-top">
          <div className="d-flex flex-column align-items-center justify-content-center gap-2">
            <Image
              src="/next.svg"
              alt="Next.js logo"
              width={120}
              height={25}
              priority
            />
            <p className="text-secondary small">
              Powered by Next.js and Lightstreamer
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
