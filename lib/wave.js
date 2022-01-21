// https://www.pianshen.com/article/3817885397/

const { Buffer } = require('buffer');
const fs = require('fs');
const { int, genExtendArray, toData } = require('./utils');

const toLittleEnd = (val, byteCount) => {
  let high = val;
  const littleBytes = [];
  let i = 0;
  while (i < byteCount) {
    const low = high & 255;
    high >>= 8;
    littleBytes.push(low);
    i += 1;
  }
  return littleBytes;
};

const saveWavByPcm = (path, samples, samplingRate = 10000, channel = 1, bit = 8) => {
  const littleEndSamples = genExtendArray([]);
  for (let i = 0; i < samples.length; i += 1) {
    littleEndSamples.extend(toLittleEnd(samples[i], int(bit / 8)));
  }

  let data = genExtendArray([]);
  // 第一段
  data.extend(toData('RIFF'));
  data.extend(toLittleEnd(littleEndSamples.length + 32, 4));
  data.extend(toData('WAVE'));

  data.extend(toData('fmt '));
  data.extend([16, 0, 0, 0]);
  data.extend([1, 0]);
  // 声道：单声道
  data.extend([channel, 0]);
  // 采样率；假设是 20000
  data.extend(toLittleEnd(samplingRate, 4));
  // 比特率：声道数 * 采样率 * 采样位数 / 8
  data.extend(toLittleEnd(int(channel * samplingRate * bit / 8), 4));
  // 数据块的对齐单位，声道数 * 采样位数 / 8
  data.extend([int(channel * bit / 8), 0]);
  // 采样位数
  data.extend([bit, 0]);

  data.extend(toData('data'));
  data.extend(toLittleEnd(littleEndSamples.length, 4));

  data = data.concat(littleEndSamples);

  const buffer = Buffer.from(data);

  fs.writeFile(path, buffer, {
    encoding: 'binary',
  }, err => {
    if (err) {
      throw err;
    }
    console.log(`${path} 生成成功!`);
  });
};

module.exports = {
  saveWavByPcm,
};
