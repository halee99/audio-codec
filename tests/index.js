const path = require('path');
const { HighNotation, LowNotation } = require('./song-of-joy');
const { AudioCodec } = require('../lib');
const { pipe } = require('../lib/utils');

// 双声道欢乐颂
const test1 = () => {
  const audioCodec = new AudioCodec({
    samplingRate: 44100,
    samplingBit: 16,
    channel: 2,
  });

  // audioCodec.waveConfig(audioCodec.sineWave);

  pipe(
    ([n1, n2]) => ([
      audioCodec.genFrequencyWav(n1),
      audioCodec.genFrequencyWav(n2),
    ]),
    ([n1, n2]) => ([
      n1.flat(),
      n2.flat(),
    ]),
    ([sam1, sam2]) => audioCodec.dualChannel(sam1, sam2),
    samples => audioCodec.saveWavByPcm(path.join(__dirname, './audio/1.双声道-欢乐颂.wav'), samples),
  )([LowNotation, HighNotation]);
};

// 谐波双声道欢乐颂
const test2 = () => {
  const audioCodec = new AudioCodec({
    samplingRate: 44100,
    samplingBit: 16,
    channel: 2,
  });

  // audioCodec.waveConfig(audioCodec.sineWave);

  pipe(
    ([n1, n2]) => {
      const lowSamples = audioCodec.genFrequencyWav(n1);
      // 谐波
      const harmonicLowSamples = audioCodec.genFrequencyWav(n1, 2);
      const heightSamples = audioCodec.genFrequencyWav(n2);
      // 谐波
      const harmonicHeightSamples = audioCodec.genFrequencyWav(n2, 2);
      return [
        audioCodec.mixSampleGroups(lowSamples, harmonicLowSamples, 0.6, 0.4),
        audioCodec.mixSampleGroups(heightSamples, harmonicHeightSamples, 0.6, 0.4),
      ];
    },
    ([n1, n2]) => ([
      n1.flat(),
      n2.flat(),
    ]),
    ([sam1, sam2]) => audioCodec.dualChannel(sam1, sam2),
    samples => audioCodec.saveWavByPcm(path.join(__dirname, './audio/2.谐波-双声道-欢乐颂.wav'), samples),
  )([LowNotation, HighNotation]);
};

// ADSR双声道
const test3 = () => {
  const audioCodec = new AudioCodec({
    samplingRate: 44100,
    samplingBit: 16,
    channel: 2,
  });

  // audioCodec.waveConfig(audioCodec.sineWave);

  const ADSR = {
    A: 0.1,
    D: 0.2,
    S: 0.5,
    sustain: 0.7,
  };

  pipe(
    ([n1, n2]) => ([
      audioCodec.genFrequencyWav(n1),
      audioCodec.genFrequencyWav(n2),
    ]),
    ([n1, n2]) => ([
      audioCodec.ADSRSynthesizer()(n1, ADSR),
      audioCodec.ADSRSynthesizer()(n2, ADSR),
    ]),
    ([n1, n2]) => ([
      n1.flat(),
      n2.flat(),
    ]),
    ([sam1, sam2]) => audioCodec.dualChannel(sam1, sam2),
    samples => audioCodec.saveWavByPcm(path.join(__dirname, './audio/3.ADSR-双声道-欢乐颂.wav'), samples),
  )([LowNotation, HighNotation]);
};

// 谐波ADSR双声道
const test4 = () => {
  const audioCodec = new AudioCodec({
    samplingRate: 44100,
    samplingBit: 16,
    channel: 2,
  });

  // audioCodec.waveConfig(audioCodec.squareWave);

  const ADSR = {
    A: 0.1,
    D: 0.2,
    S: 0.5,
    sustain: 0.7,
  };

  pipe(
    ([n1, n2]) => {
      const lowSampleGroups = audioCodec.genFrequencyWav(n1);
      // 谐波
      const harLowSampleGroups = audioCodec.genFrequencyWav(n1, 3);

      const highSampleGroups = audioCodec.genFrequencyWav(n2);
      // 谐波
      const harHighSampleGroups = audioCodec.genFrequencyWav(n2, 3);
      return [
        audioCodec.mixSampleGroups(lowSampleGroups, harLowSampleGroups, 0.6, 0.4),
        audioCodec.mixSampleGroups(highSampleGroups, harHighSampleGroups, 0.6, 0.4),
      ];
    },
    ([n1, n2]) => ([
      audioCodec.ADSRSynthesizer()(n1, ADSR),
      audioCodec.ADSRSynthesizer()(n2, ADSR),
    ]),
    ([n1, n2]) => ([
      n1.flat(),
      n2.flat(),
    ]),
    ([sam1, sam2]) => audioCodec.dualChannel(sam1, sam2),
    samples => audioCodec.saveWavByPcm(path.join(__dirname, './audio/4.谐波-ADSR-双声道-欢乐颂.wav'), samples),
  )([LowNotation, HighNotation]);
};


// 谐波ADSR单声道
const test5 = () => {
  const audioCodec = new AudioCodec({
    samplingRate: 44100,
    samplingBit: 16,
    channel: 1,
  });

  // audioCodec.waveConfig(audioCodec.squareWave);

  const ADSR = {
    A: 0.1,
    D: 0.2,
    S: 0.5,
    sustain: 0.7,
  };

  pipe(
    ([n1, n2]) => {
      const lowSampleGroups = audioCodec.genFrequencyWav(n1);
      // 谐波
      const harLowSampleGroups = audioCodec.genFrequencyWav(n1, 3);

      const highSampleGroups = audioCodec.genFrequencyWav(n2);
      // 谐波
      const harHighSampleGroups = audioCodec.genFrequencyWav(n2, 3);
      return [
        audioCodec.mixSampleGroups(lowSampleGroups, harLowSampleGroups, 0.6, 0.4),
        audioCodec.mixSampleGroups(highSampleGroups, harHighSampleGroups, 0.6, 0.4),
      ];
    },
    ([n1, n2]) => ([
      audioCodec.ADSRSynthesizer()(n1, ADSR),
      audioCodec.ADSRSynthesizer()(n2, ADSR),
    ]),
    ([n1, n2]) => ([
      n1.flat(),
      n2.flat(),
    ]),
    ([n1, n2]) => (audioCodec.mixSamples(n1, n2, 0.5, 0.5)),
    samples => audioCodec.saveWavByPcm(path.join(__dirname, './audio/5.谐波-ADSR-单声道-欢乐颂.wav'), samples),
  )([LowNotation, HighNotation]);
};

test1();
test2();
test3();
test4();
test5();
