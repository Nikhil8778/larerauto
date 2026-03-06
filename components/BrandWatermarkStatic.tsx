"use client";

export default function BrandWatermarkStatic() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.035] md:opacity-[0.06]"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-6 text-center text-[28px] font-semibold tracking-[0.25em] text-black/70 sm:text-[36px] md:text-[46px] lg:text-[56px]">
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          <span>HONDA</span>
          <span>TOYOTA</span>
          <span>AUDI</span>
          <span>RAM</span>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          <span>HYUNDAI</span>
          <span>MERCEDES</span>
          <span>BMW</span>
          <span>NISSAN</span>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          <span>FORD</span>
          <span>KIA</span>
          <span>VOLKSWAGEN</span>
          <span>MAZDA</span>
        </div>

      </div>
    </div>
  );
}