import { useEffect, useState } from "react";

const images = [
  "/uploads/home/dote-1.png",
  "/uploads/home/dote-2.png",
  "/uploads/home/dote-3.png",
];

const ImageSlider = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000); // slow transition (govt style)

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-36 overflow-hidden rounded-t-lg">
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt="DOTE"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
};

export default ImageSlider;
