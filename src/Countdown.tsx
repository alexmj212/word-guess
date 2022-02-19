import { useEffect, useState } from "react";

const Countdown = () => {
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);

  const calculateTime = () => {
    const now = new Date().getTime();
    const endOfDay = new Date().setHours(23, 59, 59, 999);
    const distance = now - endOfDay;

    setHours(
      Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) * -1 - 1
    );
    setMinutes(
      Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)) * -1 - 1
    );
    setSeconds(Math.floor((distance % (1000 * 60)) / 1000) * -1 - 1);
  };

  useEffect(() => {
    calculateTime();
    const timer = setInterval(() => {
      calculateTime();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center py-4">
      Next Daily Puzzle Available:{" "}
      <div className="text-4xl font-bold">
        {hours.toString().padStart(2, "0") +
          ":" +
          minutes.toString().padStart(2, "0") +
          ":" +
          seconds.toString().padStart(2, "0")}
      </div>
    </div>
  );
};

export default Countdown;
