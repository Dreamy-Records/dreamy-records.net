export type Member = {
  slug: string;
  name: string;
  nameEn: string;
  role: string;
  icon?: string;
  bio: string[];
  socials: { label: string; href: string }[];
};
export const members: Member[] = [
  {
    slug: 'myon',
    name: 'みょん',
    nameEn: 'MYON',
    role: '編曲 / DJ / ボーカル / 代表',
    icon: '/assets/members/myon.webp',
    bio: [
      'Dreamy Records代表。\n中学生時代に東方アレンジなどに影響を受け、サークル活動を開始。\nTranceやHardmusicを得意としており、サークルの楽曲制作、ボーカル、DJなどをする他、踊ってみたでも活動しており、あつまれ東方ステーション2024Bad Apple!!feat.nomico踊ってみたで出演したりしてる。'

    ],
    socials: [
      { label: 'X / TWITTER', href: 'https://x.com/myondreamy/' },
      { label: 'YOUTUBE(Dreamy Records)', href: 'https://www.youtube.com/@dreamy_records' },
    ],
  },
  {
    slug: 'Echi-Echi_Man_Takashi',
    name: 'えちえちマンたかし',
    nameEn: 'Echi-Echi Man Takashi',
    role: '作詞 / ボーカル',
    icon: '/assets/members/takashi.png',
    bio: [
      'ダンカグのあのえちえちマンたかし本人かなまいの幻想入りRadioでハガキを投稿している。\n東方知ったのは鈴仙うどんげのエロ同人\n作詞担当気分が乗れば編曲とボーカルをいずれやるかも？\nいつのまにかサークルよりコスプレしかしてない人間\n東方ニコレクションのマツヨイナイトバグ歌ってみたでイイネ賞受賞\n一応最年長である。保護者ですよろしくね'
    ],
    socials: [
      { label: 'X / TWITTER', href: 'https://x.com/TOMATOkatuzetu' },
      { label: 'YOUTUBE', href: 'https://youtube.com/channel/UCxu7Md1PbkYe8tveON_jcGA?si=abA8kjrY8bJ6iWWx' },
    ],
  },
  {
    slug: 'kudaken',
    name: 'くだけん',
    nameEn: 'KUDAKEN',
    role: '事務 / デザイン / 映像 / Web',
    icon: '/assets/members/kudaken.png',
    bio: [
      '栃木生まれ栃木育ち\nEDMと映画好き\nSkrillex愛してる',
    ],
    socials: [
      { label: 'OFFICIAL SITE', href: 'https://kudaken.com/' },      
      { label: 'X / TWITTER', href: 'https://x.com/kudaken0/' },
      { label: 'INSTAGRAM', href: 'https://www.instagram.com/kudaken0/' },
      { label: 'YOUTUBE', href: 'https://youtube.com/kudaken' },
      { label: 'GITHUB', href: 'https://github.com/kudaken0' },
      { label: 'BLUESKY', href: 'https://bsky.app/profile/kudaken.com' },
    ],
  },
  {
    slug: 'junkdaisuki',
    name: 'ジャンク大好き人間',
    nameEn: 'junkdaisuki',
    role: 'サポート',
    icon: '/assets/members/junk.png',
    bio: [
      'スマホやゲーム機などをよく修理しているジャンク大好き人間です♪\n誕生日は2月5日！生まれは東京都でも育ちは栃木県！\n一番の推しはフランドール·スカーレット！\n入ったばかりでまだ分からないこともありますがよろしくお願いします♪',
    ],
    socials: [
      { label: 'X / TWITTER', href: 'https://x.com/junkdaisuki_/' },
      { label: 'INSTAGRAM', href: 'https://www.instagram.com/junkdaisuki_/' },
      { label: 'YOUTUBE', href: 'https://youtube.com/@junkdaisuki' },
      { label: 'BLUESKY', href: 'https://bsky.app/profile/junkdaisuki.bsky.social' },
      { label: 'MIXI2', href: 'hhttps://mixi.social/@junkdaisuki_' },
      { label: 'MISSKEY', href: 'https://misskey.io/@DSidaisuki' },
    ],
  },
  {
    slug: 'naonot',
    name: 'ナオノット',
    nameEn: 'NAONOT',
    role: '運搬 / 搬入 / サポート',
    icon: '/assets/members/naonot.jpeg',
    bio: [
      'オーエンを愛し続ける狂人ナオノットです!!\n小学2年の時からオーエン中毒者やってます!!\n神奈川の民基本搬入、運搬をメインで基本出来る事はなんでもやる奴',
    ],
    socials: [{ label: 'X / TWITTER', href: 'https://x.com/nao_not1222' }],
  },

];
