import ISSDataExtended from "@/components/ISSDataExtended";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <div className="container py-4">
        {/* ISS Telemetry Data Component */}
        <div className="row mb-4">
          <div className="col">
            <ISSDataExtended />
          </div>
        </div>
      </div>
    </>
  );
}
