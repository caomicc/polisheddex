'use client';

import { BentoGrid, BentoGridItem } from '@/components/ui/bento-box';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { PokemonSprite } from '@/components/pokemon/pokemon-sprite';
// import { useFaithfulPreference } from '@/contexts';

export default function Home() {
  // const { showFaithful } = useFaithfulPreference(); // This should be determined by your app logic

  return (
    <div className="mb-10 pb-12 px-4 lg:p-4">
      <div className="relative mx-auto lg:my-10 flex max-w-7xl flex-col items-center justify-center">
        {/* <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
          <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
        </div> */}
        {/* <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
          <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
        </div> */}
        {/* <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
          <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </div> */}
        <div className="py-10 md:py-20">
          <h1 className="relative z-10 mx-auto max-w-3xl text-center text-3xl font-bold text-slate-700 md:text-4xl lg:text-6xl dark:text-slate-300">
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
              <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-neutral-900 px-6 py-3 text-sm font-medium dark:text-white backdrop-blur-3xl gap-1">
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
                href="https://github.com/Rangi42/polishedcrystal/releases/tag/v3.2.1"
                target="_blank"
                className="flex items-center gap-2 w-60"
              >
                Download game on GitHub
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
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
            <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {getItems(false).map((item, i) => (
                <BentoGridItem
                  key={i}
                  title={item.title}
                  description={item.description}
                  header={item.header}
                  href={item.href}
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

const PokemonSkeleton = ({ showFaithful }: { showFaithful: boolean }) => {
  const variants = {
    initial: {
      width: 0,
    },
    animate: {
      width: '100%',
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      width: ['0%', '100%'],
      transition: {
        duration: 2,
      },
    },
  };
  // Use an array of objects for better structure and clarity
  const stats = [
    {
      label: 'HP',
      fixedWidth: 53,
      barColor: 'bg-red-400 dark:bg-red-400 border-transparent',
    },
    {
      label: 'Atk',
      fixedWidth: 55,
      barColor: 'bg-orange-400 dark:bg-orange-400 border-transparent',
    },
    {
      label: 'Def',
      fixedWidth: 72,
      barColor: 'bg-yellow-400 dark:bg-yellow-400 border-transparent',
    },
    {
      label: 'Sp. Atk',
      fixedWidth: 54,
      barColor: 'bg-blue-400 dark:bg-blue-400 border-transparent',
    },
    {
      label: 'Sp. Def',
      fixedWidth: 68,
      barColor: 'bg-green-400 dark:bg-green-400 border-transparent',
    },
    {
      label: 'Spe',
      fixedWidth: 87,
      barColor: 'bg-purple-400 dark:bg-purple-400 border-transparent',
    },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 gap-4 w-full h-full flex-col sm:flex-row min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2]"
    >
      <div className="w-full sm:w-1/4 md:w-1/3 grid grid-cols-4 sm:grid-cols-2 gap-2">
        <PokemonSprite
          className="w-full shadow-none border-neutral-100 border-1"
          pokemonName={showFaithful ? 'togepi' : 'togekiss'}
          variant="normal"
          hoverAnimate={true}
        />
        <PokemonSprite
          className="w-full shadow-none border-neutral-100 border-1"
          pokemonName="gengar"
          hoverAnimate={true}
        />
        <PokemonSprite
          className="w-full shadow-none border-neutral-100 border-1"
          pokemonName="ho-oh"
          hoverAnimate={true}
        />
        <PokemonSprite
          className="w-full shadow-none border-neutral-100 border-1"
          pokemonName={showFaithful ? 'dragonair' : 'dragonite'}
          hoverAnimate={true}
        />
      </div>
      <div className="w-full sm:w-3/4 md:w-2/3 flex-col space-y-3 content-around flex flex-wrap">
        {stats.map((stat, i) => (
          <div key={'skeleton-two' + i} className="w-full flex-row flex gap-2 items-center">
            <Badge variant="secondary" className={'w-14 lg:h-[18px] p-0!'}>
              {stat.label.toUpperCase()}
            </Badge>
            <motion.div
              variants={variants}
              style={{
                maxWidth: stat.fixedWidth + '%',
              }}
              className={`flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] lg:p-2 items-center justify-between space-x-2 optional:bg-neutral-100 dark:bg-black w-full h-2 lg:h-3 ${stat.barColor}`}
            ></motion.div>
          </div>
        ))}
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
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
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
        <Image
          src="/sprites/help-avatar.png"
          alt="avatar"
          height="100"
          width="100"
          className="rounded-full h-12 w-12"
        />
        <p className="text-xs text-neutral-500">
          What files do I need? What emulator should I be using?
        </p>
      </motion.div>
    </motion.div>
  );
};

const LocationsSkeleton = () => {
  const variants = {
    initial: {
      backgroundPosition: '0 50%',
    },
    animate: {
      backgroundPosition: ['0, 50%', '100% 50%', '0 50%'],
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
      className="overflow-hidden relative flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] rounded-lg bg-dot-black/[0.2] flex-col space-y-2"
      style={{
        backgroundImage: 'linear-gradient(-45deg, #c27aff, #51a2ff, #23a6d5, #23d5ab)',
        backgroundSize: '400% 400%',
      }}
    >
      <Image
        src="/tiles/6/21/25.webp"
        alt="Poke Center"
        fill
        className="w-full h-full object-cover object-top opacity-80"
      />
    </motion.div>
  );
};

const ItemsSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
    >
      <div className="grid grid-cols-3 gap-2 flex-1">
        {[
          {
            bg: 'bg-red-300',
            src: '/sprites/items/poke_ball.png',
            alt: 'Poké Ball',
          },
          {
            bg: 'bg-blue-200',
            src: '/sprites/items/great_ball.png',
            alt: 'Great Ball',
          },
          {
            bg: 'bg-purple-200',
            src: '/sprites/items/master_ball.png',
            alt: 'Master Ball',
          },
          {
            bg: 'bg-orange-200',
            src: '/sprites/items/potion.png',
            alt: 'Potion',
          },
          {
            bg: 'bg-green-200',
            src: '/sprites/items/repel.png',
            alt: 'Repel',
          },
          {
            bg: 'bg-yellow-200',
            src: '/sprites/items/thunderstone.png',
            alt: 'Thunderstone',
          },
        ].map((item, i) => (
          <motion.div
            key={`item-${i}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-black p-2 py-3 flex flex-col items-center"
          >
            <div
              className={cn('h-8 w-8 rounded-full mb-3 flex items-center justify-center', item.bg)}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={64}
                height={64}
                className="h-8 w-8 p-1 rounded-full"
              />
            </div>
            <div className="w-full bg-gray-100 h-4 rounded-full dark:bg-neutral-900" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const EventsSkeleton = () => {
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

  const dailyArr = new Array(4).fill(0);
  const weeklyArr = new Array(3).fill(0);
  const specialArr = new Array(6).fill(0);
  // Use fixed widths to avoid hydration mismatch
  const dailyFixedWidths = [55, 72, 54, 68];

  const weeklyFixedWidths = [87, 53, 66];

  const specialFixedWidths = [65, 78, 54, 82, 90, 20, 50];

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] space-y-2 flex-col sm:flex-row gap-2 sm:gap-4"
    >
      <motion.div
        variants={variants}
        className="flex flex-col space-y-2 rounded-lg border border-neutral-100 dark:border-white/[0.2] p-2 items-start space-x-2 w-full sm:w-1/3 h-full ml-auto bg-white dark:bg-black text-center"
      >
        <div className="w-full bg-red-200 p-1 text-red-900 font-black rounded-md text-sm sm:text-base">
          Daily
        </div>
        {dailyArr.map((_, i) => (
          <div
            key={'skeleton-two' + i}
            style={{
              maxWidth: dailyFixedWidths[i] + '%',
            }}
            className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-1 items-center space-x-2 bg-neutral-100 dark:bg-black w-full h-3"
          ></div>
        ))}
      </motion.div>
      <motion.div
        variants={variants}
        className="flex flex-col space-y-2 rounded-lg border border-neutral-100 dark:border-white/[0.2] p-2 items-start space-x-2 w-full sm:w-1/3 h-full ml-auto bg-white dark:bg-black text-center"
      >
        <div className="w-full bg-green-200 p-1 text-green-900 font-black rounded-md text-sm sm:text-base">
          Weekly
        </div>
        {weeklyArr.map((_, i) => (
          <div
            key={'skeleton-two' + i}
            style={{
              maxWidth: weeklyFixedWidths[i] + '%',
            }}
            className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-1 items-center space-x-2 bg-neutral-100 dark:bg-black w-full h-3"
          ></div>
        ))}
      </motion.div>
      <motion.div
        variants={variants}
        className="flex flex-col space-y-2 rounded-lg border border-neutral-100 dark:border-white/[0.2] p-2 items-start space-x-2 w-full sm:w-1/3 h-full ml-auto bg-white dark:bg-black text-center"
      >
        <div className="w-full bg-purple-200 p-1 text-purple-900 font-black rounded-md text-sm sm:text-base">
          Special
        </div>
        {specialArr.map((_, i) => (
          <div
            key={'skeleton-two' + i}
            style={{
              maxWidth: specialFixedWidths[i] + '%',
            }}
            className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-1 items-center space-x-2 bg-neutral-100 dark:bg-black w-full h-3"
          ></div>
        ))}
      </motion.div>
    </motion.div>
  );
};

const AbilitiesSkeleton = () => {
  const variants = {
    initial: {
      width: 0,
    },
    animate: {
      width: '100%',
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      width: ['0%', '100%'],
      transition: {
        duration: 2,
      },
    },
  };
  const arr = new Array(6).fill(0);
  // Use fixed widths to avoid hydration mismatch
  const fixedWidths = [55, 72, 54, 68, 87, 53];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-col space-y-2"
    >
      {arr.map((_, i) => (
        <motion.div
          key={'skeleton-two' + i}
          variants={variants}
          style={{
            maxWidth: fixedWidths[i] + '%',
          }}
          className="flex flex-row rounded-full border border-neutral-100 dark:border-white/[0.2] p-2  items-center space-x-2 bg-neutral-100 dark:bg-black w-full h-4"
        ></motion.div>
      ))}
    </motion.div>
  );
};

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
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.2] flex-row sm:space-x-2"
    >
      <motion.div
        variants={first}
        className="h-full w-1/3 rounded-2xl bg-white p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
      >
        <PokemonSprite
          pokemonName="Meganium"
          variant="normal"
          type={'animated'}
          size="default"
          className="shadow-none"
        />
        <p className="sm:text-sm text-xs text-center font-black text-neutral-500 mt-4 mb-2">
          Meganium
        </p>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <Badge variant="grass">grass</Badge>
          <Badge variant="fairy">fairy</Badge>
        </div>
      </motion.div>
      <motion.div className="h-full relative z-20 w-1/3 rounded-2xl bg-white p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center">
        <PokemonSprite
          pokemonName="Feraligatr"
          variant="normal"
          type={'animated'}
          size="default"
          className="shadow-none"
        />
        <p className="sm:text-sm text-xs text-center font-black text-neutral-500 mt-4 mb-2">
          Feraligatr
        </p>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <Badge variant="water">Water</Badge>
          <Badge variant="dark">Dark</Badge>
        </div>
      </motion.div>
      <motion.div
        variants={second}
        className="h-full w-1/3 rounded-2xl bg-white p-4 dark:bg-black dark:border-white/[0.1] border border-neutral-200 flex flex-col items-center justify-center"
      >
        <PokemonSprite
          pokemonName="Typhlosion"
          variant="normal"
          type={'animated'}
          size="default"
          className="shadow-none"
        />
        <p className="sm:text-sm text-xs text-center font-black text-neutral-500 mt-4 mb-2">
          Typhlosion
        </p>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <Badge variant="fire">Fire</Badge>
          <Badge variant="ground">Ground</Badge>
        </div>
      </motion.div>
    </motion.div>
  );
};

const getItems = (showFaithful: boolean) => [
  {
    title: 'Pokémon',
    description: <span className="text-sm">Discover stats, types, and evolutions</span>,
    header: <PokemonSkeleton showFaithful={showFaithful} />,
    href: '/pokemon',
    className: 'col-span-1 sm:col-span-2 lg:col-span-2',
    icon: <Image src="/sprites/poke-ball.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Attackdex',
    description: <span className="text-sm">From Tackle to Thunder</span>,
    header: <AttackdexSkeleton />,
    href: '/moves',
    className: 'col-span-1 lg:col-span-1',
    icon: <Image src="/sprites/tm-case.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Locations',
    description: <span className="text-sm">From Kanto to the Orange Islands</span>,
    header: <LocationsSkeleton />,
    href: '/locations',
    className: 'col-span-1 lg:col-span-1',
    icon: <Image src="/sprites/town-map.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Items',
    description: <span className="text-sm">Every item, every effect</span>,
    header: <ItemsSkeleton />,
    href: '/items',
    className: 'col-span-1 lg:col-span-1',
    icon: <Image src="/sprites/forage-bag.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Special Events',
    description: <span className="text-sm">Dailies, weeklies, and more</span>,
    header: <EventsSkeleton />,
    href: '/events',
    className: 'col-span-1 sm:col-span-1 lg:col-span-2',
    icon: <Image src="/sprites/mystery-egg.png" width={24} height={24} alt="Icon 1" />,
  },
  {
    title: 'Abilities',
    description: <span className="text-sm">Unlock competitive advantages</span>,
    header: <AbilitiesSkeleton />,
    href: '/abilities',
    className: 'col-span-1 sm:col-span-1 lg:col-span-1',
    icon: <Image src="/sprites/ability-capsule.png" width={24} height={24} alt="Icon 1" />,
  },

  {
    title: 'Build Winning Teams',
    description: <span className="text-sm">Strategy meets synergy</span>,
    header: <TeamBuilderSkeleton />,
    href: '/team-builder',
    className: 'col-span-1 sm:col-span-2 lg:col-span-3',
    icon: <Image src="/sprites/choice-scarf.png" width={24} height={24} alt="Icon 1" />,
  },
];
