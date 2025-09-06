//This function stores the reduce function, which converts in-game data to its simplest form.
//It decapitalizes everything
//Removes underscores, dashes, apostrophes, periods
//Replaces Jupiter and Venus with m and f

const reduce = (str) => {
  return str
    .toLowerCase()
    .replaceAll(' ', '')
    .replaceAll('_', '')
    .replaceAll('-', '')
    .replaceAll("'", '')
    .replaceAll('.', '')
    .replaceAll('♂', 'm')
    .replaceAll('♀', 'f')
    .replaceAll('é', 'e');
};

export default reduce;
