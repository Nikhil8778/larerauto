"use client";

export default function BrandWatermarkStatic() {
  return (
    <div className="la-static-watermark" aria-hidden="true">
      <div className="la-static-watermark-inner">
        <div className="la-static-watermark-row">
          <span>HONDA</span>
          <span>TOYOTA</span>
          <span>AUDI</span>
          <span>RAM</span>
        </div>

        <div className="la-static-watermark-row">
          <span>HYUNDAI</span>
          <span>MERCEDES</span>
          <span>BMW</span>
          <span>NISSAN</span>
        </div>

        <div className="la-static-watermark-row">
          <span>FORD</span>
          <span>KIA</span>
          <span>VOLKSWAGEN</span>
          <span>MAZDA</span>
        </div>
      </div>
    </div>
  );
}