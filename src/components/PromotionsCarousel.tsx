import beatsPraiaBanner from "@/assets/promotions/beats-praia-banner.png";

export const PromotionsCarousel = () => {
  return (
    <div className="relative w-full px-4">
      <div className="rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <img
          src={beatsPraiaBanner}
          alt="Combo BEATS - Leve 3 por 20"
          className="w-full h-56 md:h-[220px] object-cover"
        />
      </div>
    </div>
  );
};
