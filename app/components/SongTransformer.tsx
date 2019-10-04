import React, { useState, useEffect, FunctionComponent } from "react";
import ChordSheetJS, { Song } from 'chordsheetjs'
import Chord from 'chordjs'

interface SongProps {
  chords: Array<Chord>
  htmlSong: string
}
interface Props {
  chordProSong?: string
  chordSheetSong?: string
  transposeDelta: number
  children(props: SongProps): JSX.Element;
}

const processChord = (item: (ChordSheetJS.ChordLyricsPair | ChordSheetJS.Tag), processor: (parsedChord: Chord) => Chord) => {
  if (item instanceof ChordSheetJS.ChordLyricsPair && item.chords) {
    const parsedChord = Chord.parse(item.chords);

    if (parsedChord) {
      const processedChordLyricsPair = item.clone();
      processedChordLyricsPair.chords = processor(parsedChord).toString();
      return processedChordLyricsPair;
    }
  }
  return item;
};

const transformSong = (song: Song, processor: (parsedChord: Chord) => Chord) => {
  song.lines = song.lines.map((line) => {
    line.items = line.items.map(item => processChord(item, processor));
    return line;
  });
  return song;
};

const SongTransformer: FunctionComponent<Props> = (props) => {
  let [chords, setChords] = useState<Array<Chord>>([])
  let [htmlSong, setHtmlSong] = useState("")

  useEffect(() => {
    let song
    if (props.chordProSong != null) {
      song = new ChordSheetJS.ChordProParser().parse(props.chordProSong);
    } else {
      song = new ChordSheetJS.ChordSheetParser({ preserveWhitespace: true }).parse(props.chordSheetSong!);
    }
    let transposedSong = song
    if (props.transposeDelta != 0) {
      transposedSong = transformSong(song, chord => chord.transpose(props.transposeDelta));
    }
    let allChords = Array<Chord>()
    transposedSong.lines.forEach(line => {
      line.items.forEach(item => {
        if (item instanceof ChordSheetJS.ChordLyricsPair && item.chords) {
          const parsedChord = Chord.parse(item.chords);
          if (parsedChord != null && allChords.find(c => c.toString() == parsedChord.toString()) == null) {
            allChords.push(parsedChord)
          }
        }
      });
    })

    const htmlSong = new ChordSheetJS.HtmlDivFormatter().format(transposedSong);
    setChords(allChords)
    setHtmlSong(htmlSong)
  }, [props.chordProSong, props.transposeDelta])

  return props.children({ chords, htmlSong })
}
export default SongTransformer