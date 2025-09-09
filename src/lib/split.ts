//This function takes a file as input and returns:
//An Array with two entries
//Entry #0 is the Polished file, split into lines
//Entry #1 is the Faithful file, split into lines
//Incidentally, it also:
//#1. Replaces all # with Poké
//#2. Replaces all Poke with Poké
//#3. Removes all @

const splitFile = (file: string, replaceAt: boolean = true) => {
  const files = [[], []];
  let data = file.trim().split('\n');
  data = data.map((line) =>
    line
      .trim()
      .replaceAll('#', 'Poké')
      .replaceAll('Poke', 'Poké')
      .replaceAll(replaceAt ? '@' : '', ''),
  );

  for (let lineNo = 0; lineNo < data.length; lineNo++) {
    //Polished/Faithful Split
    if (
      data[lineNo].toLowerCase().startsWith('if ') &&
      data[lineNo].toLowerCase().includes('faithful')
    ) {
      //Jump to the next line
      lineNo++;

      //Then keep adding the faithful lines until we hit the else condition
      while (data[lineNo] != 'else') {
        files[1].push(data[lineNo]);
        lineNo++;
      }

      //Once we hit the else condition, jump to the next line
      lineNo++;

      //Then keep adding the polished lines until we hit the endc condition
      while (data[lineNo] != 'endc') {
        files[0].push(data[lineNo]);
        lineNo++;
      }
    } else {
      files[0].push(data[lineNo]);
      files[1].push(data[lineNo]);
    }
  }
  return files;
};

export default splitFile;
