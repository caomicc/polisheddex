//This function takes a file as input and returns:
//An Array with two entries
//Entry #0 is the Polished file, split into lines
//Entry #1 is the Faithful file, split into lines
//Incidentally, it also:
//#1. Replaces all # with Poké
//#2. Replaces all Poke with Poké
//#3. Removes all @

const splitFile = (file: string, replaceAt: boolean = true) => {
  const files: string[][] = [[], []];
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
    if (data[lineNo].startsWith('if DEF(FAITHFUL)')) {
      //Jump to the next line
      lineNo++;

      //Then keep adding the faithful lines until we hit the else or endc condition
      while (lineNo < data.length && data[lineNo] != 'else' && data[lineNo] != 'endc') {
        files[1].push(data[lineNo]); // faithful only
        lineNo++;
      }

      //If we hit an else condition, the following lines are for polished
      if (lineNo < data.length && data[lineNo] == 'else') {
        lineNo++; // skip the 'else' line
        
        //Then keep adding the polished lines until we hit the endc condition
        while (lineNo < data.length && data[lineNo] != 'endc') {
          files[0].push(data[lineNo]); // polished only
          lineNo++;
        }
      }
    } else if (data[lineNo].startsWith('if !DEF(FAITHFUL)')) {
      //Jump to the next line
      lineNo++;

      //Then keep adding the polished lines until we hit the else or endc condition
      while (lineNo < data.length && data[lineNo] != 'else' && data[lineNo] != 'endc') {
        files[0].push(data[lineNo]); // polished only
        lineNo++;
      }

      //If we hit an else condition, the following lines are for faithful
      if (lineNo < data.length && data[lineNo] == 'else') {
        lineNo++; // skip the 'else' line
        
        //Then keep adding the faithful lines until we hit the endc condition
        while (lineNo < data.length && data[lineNo] != 'endc') {
          files[1].push(data[lineNo]); // faithful only
          lineNo++;
        }
      }
    } else {
      // Common lines go to both versions
      files[0].push(data[lineNo]);
      files[1].push(data[lineNo]);
    }
  }
  return files;
};

export default splitFile;
