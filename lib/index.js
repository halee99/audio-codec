const { saveWavByPcm } = require('./wave');
const { FreqMap } = require('./freq-map');
const { int } = require('./utils');

class AudioCodec {
  constructor({
    dutyCycle = 0.5,
    samplingRate = 10000,
    samplingBit = 8,
    ms = 256,
    note = 4,
    channel = 1,
  }) {
    this.dutyCycle = dutyCycle;
    // 采样率
    this.samplingRate = samplingRate;
    // 采样位数
    this.samplingBit = samplingBit;
    // 一拍的时间
    this.ms = ms;
    // 几分音符为一拍
    this.note = note;
    // 音道
    this.channel = channel;

    this.waveGenerator = this.triangularWave;

    // 样本最大值最小值
    this.calcMaxAndMinSample();
  }

  calcMaxAndMinSample() {
    const bit = this.samplingBit;
    if (bit % 8 !== 0) {
      throw new Error('采样位数必须是 8 的整数倍');
    }
    if (bit === 8) {
      this.maxSample = 255;
      this.minSample = 0;
    }
    if (bit > 8) {
      this.maxSample = 2 ** (bit - 1) - 1;
      this.minSample = -(2 ** (bit - 1));
    }
  }

  waveConfig(waveGenerator) {
    this.waveGenerator = waveGenerator.bind(this);
  }

  /**
   * 方波
   */
  squareWave(cycleHit) {
    const aCycleData = [];
    const halfCycle = cycleHit * this.dutyCycle;
    for (let i = 0; i < cycleHit; i += 1) {
      if (i < halfCycle) {
        aCycleData.push(this.maxSample);
      } else {
        aCycleData.push(this.minSample);
      }
    }

    return aCycleData;
  }

  /**
   * 三角波
   */
  triangularWave(cycleHit) {
    const aCycleData = [];
    const halfCycle = cycleHit * this.dutyCycle;
    const scale = (this.maxSample - this.minSample) / (cycleHit / 2);
    for (let i = 0; i < cycleHit; i += 1) {
      let x = 0;
      if (i < halfCycle) {
        x = int(scale * i + this.minSample);
      } else {
        x = int(scale * (cycleHit - 1 - i) + this.minSample);
      }
      aCycleData.push(x);
    }
    return aCycleData;
  }

  /**
   * 锯齿波
   */
  sawtoothWave(cycleHit) {
    const aCycleData = [];
    const scale = (this.maxSample - this.minSample) / (cycleHit - 1);
    for (let i = 0; i < cycleHit; i += 1) {
      const x = int(scale * i + this.minSample);
      aCycleData.push(x);
    }
    return aCycleData;
  }

  /**
   * 正弦波
   */
  sineWave(cycleHit) {
    const aCycleData = [];
    // 8位正弦波取上半弧；大于 8 位正弦波有符号取整个上下弧
    const magic = this.samplingBit === 8 ? 1 : 2;
    const scale = magic * Math.PI / (cycleHit - 1);
    const peakSample = (this.maxSample - this.minSample) / magic;
    for (let i = 0; i < cycleHit; i += 1) {
      const x = int(peakSample * Math.sin(i * scale));
      aCycleData.push(x);
    }

    return aCycleData;
  }

  genAFrequencySample(f, ms = 250) {
    const cycleHit = int(this.samplingRate / f);
    const aCycleData = this.waveGenerator(cycleHit);

    const dataHit = ms * (this.samplingRate / 1000);
    const cycleCount = int(dataHit / cycleHit);
    const cycleRemain = dataHit % cycleHit;

    let data = [];
    for (let i = 0; i < cycleCount; i += 1) {
      data = data.concat(aCycleData.slice(0));
    }
    data = data.concat(aCycleData.slice(0, cycleRemain));
    return data;
  }

  /**
   *
   * @param {Array} notation
   * @param {number} harmonicTimes 谐波倍数
   * @returns
   */
  genFrequencyWav(notation, harmonicTimes = 1) {
    const sampleGroups = [];
    for (let i = 0; i < notation.length; i += 1) {
      const freq = FreqMap[notation[i][0]];
      const multiple = 1 / notation[i][1] * this.note;
      sampleGroups.push(
        this.genAFrequencySample(freq * harmonicTimes, int(this.ms * multiple)),
      );
    }
    return sampleGroups;
  }

  /**
   * 混合
   */
  mixSamples(samples1, samples2, ratio1, ratio2) {
    const samples = [];
    const len = Math.min(samples1.length, samples2.length);
    for (let i = 0; i < len; i += 1) {
      const sam1 = samples1[i];
      const sam2 = samples2[i];
      let sample = int(sam1 * ratio1 + sam2 * ratio2);
      if (sample > this.maxSample) {
        sample = this.maxSample;
      } else if (sample < this.minSample) {
        sample = this.minSample;
      }
      samples.push(sample);
    }
    return samples;
  }

  /**
   * 混合
   */
  mixSampleGroups(sampleGroups1, sampleGroups2, ratio1, ratio2) {
    const len = Math.min(sampleGroups1.length, sampleGroups2.length);
    const sampleGroups = [];
    for (let i = 0; i < len; i += 1) {
      const sams1 = sampleGroups1[i];
      const sams2 = sampleGroups2[i];

      const samples = this.mixSamples(sams1, sams2, ratio1, ratio2);
      sampleGroups.push(samples);
    }
    return sampleGroups;
  }

  /**
   * 双通道音
   */
  dualChannel(samples1, samples2) {
    if (this.channel !== 2) {
      throw new Error('channel is not 2');
    }
    const len = Math.min(samples1.length, samples2.length);

    const samples = [];
    for (let i = 0; i < len; i += 1) {
      const sam1 = samples1[i];
      const sam2 = samples2[i];
      samples.push(sam1);
      samples.push(sam2);
    }
    return samples;
  }

  /**
   * 一个粗糙的 ADSR synthesizer合成器
   * https://en.wikipedia.org/wiki/Envelope_(music)
   */
  ADSRSynthesizer = () => {
    const cache = {};
    return (sampleGroups, {
      sustain,
      A,
      D,
      S,
    }) => {
      // 就暂时不考虑性能了 =.=
      const adsr = (len, x) => {
        if (cache[`${len}-${x}`] !== undefined) {
          return cache[`${len}-${x}`];
        }

        const a = len * A;
        const d = a + len * D;
        const s = d + len * S;
        const md = (sustain - 1) / (d - a);
        const nd = 1 - md * a;
        const mr = sustain / (s - len);
        const nr = -mr * len;

        let scale = 1;
        if (x <= a) {
          scale = x / a;
        } else if (x <= d) {
          scale = md * x + nd;
        } else if (x <= s) {
          scale = sustain;
        } else if (x < len - 1) {
          scale = mr * x + nr;
        } else {
          scale = 0;
        }
        cache[`${len}-${x}`] = scale;
        return scale;
      };
      const newSampleGroups = [];
      for (let i = 0; i < sampleGroups.length; i += 1) {
        const samples = sampleGroups[i];
        const newSamples = [];
        const len = samples.length;
        for (let j = 0; j < len; j += 1) {
          newSamples.push(int(samples[j] * adsr(len, j)));
        }
        newSampleGroups.push(newSamples);
      }
      return newSampleGroups;
    };
  };

  saveWavByPcm(path, samples) {
    saveWavByPcm(path, samples, this.samplingRate, this.channel, this.samplingBit);
  }
}

module.exports = {
  AudioCodec,
};
