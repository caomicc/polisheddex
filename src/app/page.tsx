'use client';

import { BentoGrid, BentoGridItem } from '@/components/ui/bento-box';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="mb-10 p-2 lg:p-4">
      <div className="relative mx-auto my-10 flex max-w-7xl flex-col items-center justify-center">
        <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
          <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
        </div>
        <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
          <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
          <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </div>
        <div className="px-4 py-10 md:py-20">
          <h1 className="relative z-10 mx-auto max-w-3xl text-center text-2xl font-bold text-slate-700 md:text-4xl lg:text-6xl dark:text-slate-300">
            {'Your Polished Crystal Journey Starts Here'.split(' ').map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: 'blur(4px)', y: 10 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: 'easeInOut',
                }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
              delay: 0.8,
            }}
            className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400"
          >
            Whether you’re a seasoned trainer or just starting, explore our database of moves,
            abilities, and locations to deepen your knowledge and improve your gameplay experience.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.9 }}
            className="relative z-10 mx-auto mt-4 flex items-center justify-center"
          >
            {/* <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-4 py-2 text-base font-medium text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-800"> */}

            {/* </span> */}
            <span className="relative inline-flex overflow-hidden rounded-full p-[1px] text-center">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-neutral-900 px-6 py-3 text-sm font-medium dark:text-white backdrop-blur-3xl">
                Use the toggle in the corner to switch between Polished and Faithful versions
              </span>
            </span>
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
              delay: 1,
            }}
            className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Button variant="default" size="lg" asChild>
              <Link
                href="https://github.com/Rangi42/polishedcrystal/releases/tag/v3.1.1"
                target="_blank"
                className="flex items-center gap-2 w-60"
              >
                Download ROM on GitHub
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
              delay: 1.2,
            }}
            className="relative z-10 mt-20 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
              {items.map((item, i) => (
                <BentoGridItem
                  key={i}
                  title={item.title}
                  description={item.description}
                  header={item.header}
                  className={cn('[&>p:text-lg]', item.className)}
                  icon={item.icon}
                />
              ))}
            </BentoGrid>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const PokemonSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2 p-2"
    >
      <div className="flex items-center space-x-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="h-8 w-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 border-2 border-gray-800 dark:border-gray-200 shrink-0"
        />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="text-center">
          <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded mb-1" />
          <div className="h-6 bg-blue-100 dark:bg-blue-900 rounded" />
        </div>
        <div className="text-center">
          <div className="h-2 bg-red-200 dark:bg-red-800 rounded mb-1" />
          <div className="h-6 bg-red-100 dark:bg-red-900 rounded" />
        </div>
        <div className="text-center">
          <div className="h-2 bg-green-200 dark:bg-green-800 rounded mb-1" />
          <div className="h-6 bg-green-100 dark:bg-green-900 rounded" />
        </div>
      </div>
    </motion.div>
  );
};
const AttackdexSkeleton = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  const moves = [
    { type: 'fire', power: '90%', variant: variants },
    { type: 'water', power: '75%', variant: variantsSecond },
    { type: 'grass', power: '60%', variant: variants },
    { type: 'electric', power: '85%', variant: variantsSecond },
  ];

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2 p-2"
    >
      {moves.map((move, i) => (
        <motion.div
          key={`move-${i}`}
          variants={move.variant}
          className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center space-x-2 bg-white dark:bg-black"
        >
          <div
            className={`h-6 w-6 rounded-full shrink-0 ${
              move.type === 'fire'
                ? 'bg-red-400'
                : move.type === 'water'
                  ? 'bg-blue-400'
                  : move.type === 'grass'
                    ? 'bg-green-400'
                    : 'bg-yellow-400'
            }`}
          />
          <div className="w-full bg-gray-100 h-4 rounded-full dark:bg-neutral-900" />
        </motion.div>
      ))}
    </motion.div>
  );
};
const HelpSkeleton = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-2xl border border-neutral-100 dark:border-white/[0.2] p-2  items-start space-x-2 bg-white dark:bg-black"
      >
        <img
          src="https://pbs.twimg.com/profile_images/1417752099488636931/cs2R59eW_400x400.jpg"
          alt="avatar"
          height="100"
          width="100"
          className="rounded-full h-10 w-10"
        />
        <p className="text-xs text-neutral-500">
          What files do I need? What emulator should I be using?
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2 items-center justify-end space-x-2 w-3/4 ml-auto bg-white dark:bg-black"
      >
        <p className="text-xs text-neutral-500">Check the FAQ.</p>
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 shrink-0" />
      </motion.div>
    </motion.div>
  );
};

const LocationsSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2 p-2"
    >
      <div className="grid grid-cols-4 gap-1 flex-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`location-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded border ${
              i % 3 === 0
                ? 'bg-green-200 dark:bg-green-800'
                : i % 3 === 1
                  ? 'bg-blue-200 dark:bg-blue-800'
                  : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-3 w-3 rounded-full bg-red-400" />
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
      </div>
    </motion.div>
  );
};

const ItemsSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2 p-2"
    >
      <div className="grid grid-cols-3 gap-2 flex-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`item-${i}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-black p-2 flex flex-col items-center"
          >
            <div
              className={`h-6 w-6 rounded mb-1 ${
                i % 4 === 0
                  ? 'bg-purple-400'
                  : i % 4 === 1
                    ? 'bg-orange-400'
                    : i % 4 === 2
                      ? 'bg-teal-400'
                      : 'bg-pink-400'
              }`}
            />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const EventsSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2 p-2"
    >
      <div className="flex items-center space-x-2 mb-2">
        <div className="h-6 w-8 bg-blue-200 dark:bg-blue-800 rounded" />
        <div className="flex-1 space-y-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`event-${i}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center space-x-2"
          >
            <div className="h-2 w-2 rounded-full bg-yellow-400" />
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded flex-1" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const AbilitiesSkeleton = () => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] rounded-lg bg-dot-black/[0.2] flex-col space-y-2 p-2"
      style={{
        background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
        backgroundSize: '400% 400%',
      }}
    >
      <motion.div
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="h-full w-full rounded-lg flex items-center justify-center"
      >
        <div className="text-white font-semibold text-lg opacity-75">✨</div>
      </motion.div>
    </motion.div>
  );
};

// const TeamBuilderSkeleton = () => {
//   return (
//     <motion.div
//       initial="initial"
//       animate="animate"
//       whileHover="hover"
//       className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-2 p-2"
//     >
//       {Array.from({ length: 3 }).map((_, i) => (
//         <motion.div
//           key={`team-${i}`}
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ delay: i * 0.1 }}
//           className="h-full w-1/3 rounded-2xl bg-white p-2 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
//         >
//           <div
//             className={`h-8 w-8 rounded-full mb-2 ${
//               i === 0 ? 'bg-red-400' : i === 1 ? 'bg-blue-400' : 'bg-green-400'
//             }`}
//           />
//           <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1" />
//           <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
//         </motion.div>
//       ))}
//     </motion.div>
//   );
// };

const TeamBuilderSkeleton = () => {
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row space-x-2"
    >
      <motion.div
        variants={first}
        className="h-full w-1/3 rounded-2xl bg-white p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
      >
        <img
          src="https://pbs.twimg.com/profile_images/1417752099488636931/cs2R59eW_400x400.jpg"
          alt="avatar"
          height="100"
          width="100"
          className="rounded-full h-10 w-10"
        />
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          Just code in Vanilla Javascript
        </p>
        <p className="border border-red-500 bg-red-100 dark:bg-red-900/20 text-red-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Delusional
        </p>
      </motion.div>
      <motion.div className="h-full relative z-20 w-1/3 rounded-2xl bg-white p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center">
        <img
          src="https://pbs.twimg.com/profile_images/1417752099488636931/cs2R59eW_400x400.jpg"
          alt="avatar"
          height="100"
          width="100"
          className="rounded-full h-10 w-10"
        />
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          Tailwind CSS is cool, you know
        </p>
        <p className="border border-green-500 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Sensible
        </p>
      </motion.div>
      <motion.div
        variants={second}
        className="h-full w-1/3 rounded-2xl bg-white p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
      >
        <img
          src="https://pbs.twimg.com/profile_images/1417752099488636931/cs2R59eW_400x400.jpg"
          alt="avatar"
          height="100"
          width="100"
          className="rounded-full h-10 w-10"
        />
        <p className="sm:text-sm text-xs text-center font-semibold text-neutral-500 mt-4">
          I love angular, RSC, and Redux.
        </p>
        <p className="border border-orange-500 bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xs rounded-full px-2 py-0.5 mt-4">
          Helpless
        </p>
      </motion.div>
    </motion.div>
  );
};

const items = [
  {
    title: 'Pokémon',
    description: <span className="text-sm">Discover stats, types, and evolutions</span>,
    header: <PokemonSkeleton />,
    className: 'md:col-span-2',
    icon: <Image src="/sprites/poke-ball.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Need Help?',
    description: <span className="text-sm">Quick answers to common queries</span>,
    header: <HelpSkeleton />,
    className: 'md:col-span-1',
    icon: <Image src="/sprites/escape-rope.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Attackdex',
    description: <span className="text-sm">From Tackle to Thunder</span>,
    header: <AttackdexSkeleton />,
    className: 'md:col-span-1',
    icon: <Image src="/sprites/tm-case.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Locations',
    description: <span className="text-sm">From Kanto to the Orange Islands</span>,
    header: <LocationsSkeleton />,
    className: 'md:col-span-1',
    icon: <Image src="/sprites/town-map.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Items',
    description: <span className="text-sm">Every item, every effect</span>,
    header: <ItemsSkeleton />,
    className: 'md:col-span-1',
    icon: <Image src="/sprites/forage-bag.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Special Events',
    description: <span className="text-sm">Dailies, weeklies, and more</span>,
    header: <EventsSkeleton />,
    className: 'md:col-span-2',
    icon: <Image src="/sprites/mystery-egg.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Abilities',
    description: <span className="text-sm">Unlock competitive advantages</span>,
    header: <AbilitiesSkeleton />,
    className: 'md:col-span-1',
    icon: <Image src="/sprites/ability-capsule.png" width={24} height={24} alt="Icon 1" />,
  },

  {
    title: 'Build Winning Teams',
    description: <span className="text-sm">Strategy meets synergy</span>,
    header: <TeamBuilderSkeleton />,
    className: 'md:col-span-3',
    icon: <Image src="/sprites/choice-scarf.png" width={24} height={24} alt="Icon 1" />,
  },
];
