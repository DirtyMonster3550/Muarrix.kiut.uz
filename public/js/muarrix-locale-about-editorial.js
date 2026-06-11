/**
 * UZ / EN: «О журнале» va «Редакционный совет»
 */
(function () {
  const pack = {
    uz: {
      about_body_html:
        '<p>«Muarrix.kiut.uz» — yiliga ikki marta ingliz, o‘zbek va rus tillarida elektron shaklda chiqadigan jurnal. Jurnal oliy o‘quv yurtlari o‘qituvchilari, tadqiqotchilari va mutaxassislari uchun mo‘ljallangan hamda keng mutaxassislar doirasiga qaratilgan professional ilmiy-tahliliy nashr hisoblanadi.</p>'
        + '<p>Ilmiy-tadqiqot ishlar barcha fan sohalarida tez rivojlanmoqda. Turli muammolarga yangi yechimlar, fikrlar va yondashuvlar paydo bo‘lmoqda. Bu jarayon ilmiy jamoa uchun xarakterli. Tadqiqot natijalari bo‘yicha ilmiy jurnallarda maqolalar chop etish zarur.</p>'
        + '<p>«Muarrix.kiut.uz»da nazariy va amaliy tabiatdagi, fan va texnika sohalaridagi keng mutaxassislar uchun qiziq bo‘lishi mumkin bo‘lgan maqolalar nashr etiladi. Jurnal texnika, fan va texnologiya sohasidagi ishlarni ifodalash vositasi bo‘lib, asosan ilmiy tadqiqotlar va texnologik ishlanmalar haqidagi maqolalar, muayyan muammo yoki mavzu bo‘yicha original mulohazalar, fan va texnika sohasining holati haqida umumiy tasavvur beradigan sharh maqolalarini o‘z ichiga oladi. Fanlararo xulosalar hamda fizika, matematika va boshqalar usullaridan foydalangan holda olib borilgan iqtisodiy tadqiqotlar mamnuniyat bilan qabul qilinadi.</p>'
        + '<p>O‘zbekiston iqtisodiyotida sodir bo‘layotgan jarayonlarni tahlil qilishga alohida e’tibor qaratiladi. Bunday nashrlar dunyo olimlari uchun ma’lumot manbai va o‘zaro aloqa vositasi hisoblanadi.</p>'
        + '<h2>Jurnal bo‘limlari</h2>'
        + '<ul class="about-sections">'
        + '<li>01.02.00 – Mexanika</li>'
        + '<li>05.00.00 – Texnika fanlari'
        + '<ul>'
        + '<li>05.01.00 – Axborot texnologiyalari, boshqaruv va kompyuter grafikasi</li>'
        + '<li>05.02.00 – Mashinasozlik va mashinashunoslik. Mashinasozlikda materiallarni qayta ishlash. Metallurgiya. Aviatsiya texnikasi</li>'
        + '<li>05.03.00 – Asbobsozlik, metrologiya va axborot-o‘lchov asboblari va tizimlari</li>'
        + '<li>05.04.00 – Radiotexnika va aloqa</li>'
        + '<li>05.05.00 – Energetika va elektrotexnika. Qishloq xo‘jaligini elektrifikatsiya qilish texnologiyasi. Elektronika</li>'
        + '<li>05.07.00 – Qishloq xo‘jaligi ishlab chiqarishini mexanizatsiyalash texnologiyasi</li>'
        + '<li>05.08.00 – Transport</li>'
        + '<li>05.09.00 – Qurilish</li>'
        + '</ul></li>'
        + '<li>18.00.00 – Arxitektura</li>'
        + '</ul>'
        + '<p>Nashr uchun ariza maxsus <a href="/register.html">forma</a> orqali qoldiriladi va qisqa muddatda ko‘rib chiqiladi. Davriy nashrlar tahririy-nashr jarayoni talablariga muvofiq rasmiylashtiriladi. Maqolalar taqrizchilar tomonidan ko‘rib chiqiladi va yangi jurnal soni chiqquniga qadar tahririyat yig‘ilishida nashr etish to‘g‘risida qaror qabul qilinadi.</p>',
      editorial_lead: 'Muarrix.kiut.uz tahririyati.',
      editorial_body_html:
        '<h2>Bosh muharrir</h2>'
        + '<p class="editorial-member"><strong>Kongratbay Sharipov</strong>, texnika fanlari doktori, professor, Kimyo International University in Tashkent</p>'
        + '<h2>Muharrir o‘rinbosari</h2>'
        + '<p class="editorial-member"><strong>Akmal Rustamov</strong>, texnika yo‘nalishi bo‘yicha falsafa doktori (PhD), dotsent, Kimyo International University in Tashkent</p>'
        + '<h2>Tahririy hay’at</h2>'
        + '<ul class="editorial-board-list">'
        + '<li><strong>Chikahiro Minova</strong>, texnika fanlari doktori (DSc), professor, Kimyo International University in Tashkent</li>'
        + '<li><strong>Savet Xudaykulov</strong>, texnika fanlari doktori, professor, Kimyo International University in Tashkent</li>'
        + '<li><strong>Mohiniso Xidirova</strong>, texnika fanlari doktori, dotsent, Kimyo International University in Tashkent</li>'
        + '<li><strong>Ibrohim Rustamov</strong>, texnika fanlari doktori (DSc), Kimyo International University in Tashkent</li>'
        + '<li><strong>Djambul Yusupov</strong>, fizika-matematika fanlari doktori (DSc), Kimyo International University in Tashkent</li>'
        + '<li><strong>Sanjar Ruzimov</strong>, texnika fanlari doktori (DSc), dotsent, Turin politexnika universiteti, Toshkent</li>'
        + '<li><strong>Dilbar Mirzarakmetova</strong>, biotexnologiya fanlari doktori, Kimyo International University in Tashkent, O‘zbekiston</li>'
        + '<li><strong>Hans Ochsner</strong>, texnika fanlari doktori (DSc), qishloq xo‘jaligi muhandisligi va bioenergetika davlat instituti direktori, Germaniya</li>'
        + '<li><strong>Andreas Lemmer</strong>, texnika fanlari doktori (DSc), professor, qishloq xo‘jaligi muhandisligi va bioenergetika davlat instituti, Germaniya</li>'
        + '<li><strong>Bazarov Baxtiyor Imomovich</strong>, texnika fanlari doktori (DSc), professor, Toshkent davlat transport universiteti</li>'
        + '<li><strong>Jamshid Kaniyev</strong>, texnika yo‘nalishi bo‘yicha falsafa doktori (PhD), Kimyo International University in Tashkent</li>'
        + '<li><strong>Otabek Muhitdinov</strong>, texnika yo‘nalishi bo‘yicha falsafa doktori (PhD), dotsent, Kimyo International University in Tashkent</li>'
        + '<li><strong>Murodjon Sherbaev</strong>, texnika yo‘nalishi bo‘yicha falsafa doktori (PhD), dotsent, Kimyo International University in Tashkent</li>'
        + '<li><strong>Sarvar Yusupov</strong>, texnika yo‘nalishi bo‘yicha falsafa doktori (PhD), Kimyo International University in Tashkent</li>'
        + '<li><strong>Khammid Yusupov</strong>, fizika yo‘nalishi bo‘yicha falsafa doktori, Kimyo International University in Tashkent, O‘zbekiston</li>'
        + '<li><strong>Igor Simone Steevano</strong>, texnika yo‘nalishi bo‘yicha falsafa doktori (PhD), Politecnico di Torino, Italiya</li>'
        + '</ul>',
    },
    en: {
      about_body_html:
        '<p>The <em>Muarrix.kiut.uz</em> is a semi-annual scientific publication issued electronically in English, Uzbek, and Russian. It is aimed at faculty, researchers, and specialists of higher education institutions and serves as a professional scientific and analytical journal for a broad audience of experts.</p>'
        + '<p>Research work is developing rapidly in all fields of science. New solutions, opinions, and approaches to various problems emerge continuously — a characteristic feature of the scientific community. Publications in scientific journals based on research results are essential.</p>'
        + '<p>The journal publishes both theoretical and empirical articles of interest to specialists across science and engineering. It presents research papers and technological developments, original reflections on specific problems or topics, and review articles providing an overview of particular fields of science and technology. Interdisciplinary findings and economic studies using methods from other sciences — physics, mathematics, etc. — are welcome.</p>'
        + '<p>Particular attention is paid to analysing processes in the economy of Uzbekistan. Such publications serve as a source of information and a channel for interaction among scholars worldwide.</p>'
        + '<h2>Journal sections</h2>'
        + '<ul class="about-sections">'
        + '<li>01.02.00 – Mechanics</li>'
        + '<li>05.00.00 – Engineering sciences'
        + '<ul>'
        + '<li>05.01.00 – Information technology, control, and computer graphics</li>'
        + '<li>05.02.00 – Mechanical engineering and machine science. Materials processing in mechanical engineering. Metallurgy. Aviation technology</li>'
        + '<li>05.03.00 – Instrument making, metrology, and information-measuring instruments and systems</li>'
        + '<li>05.04.00 – Radio engineering and communications</li>'
        + '<li>05.05.00 – Power engineering and electrical engineering. Electrification of agricultural production. Electronics</li>'
        + '<li>05.07.00 – Mechanisation technology in agricultural production</li>'
        + '<li>05.08.00 – Transport</li>'
        + '<li>05.09.00 – Construction</li>'
        + '</ul></li>'
        + '<li>18.00.00 – Architecture</li>'
        + '</ul>'
        + '<p>Publication requests are submitted through a dedicated <a href="/register.html">online form</a> and reviewed promptly. Issues are prepared according to editorial and publishing requirements. Articles are peer-reviewed, and the decision to publish is made at an editorial board meeting before each new issue is released.</p>',
      editorial_lead: 'Editorial office of the Muarrix.kiut.uz.',
      editorial_body_html:
        '<h2>Editor-in-Chief</h2>'
        + '<p class="editorial-member"><strong>Kongratbay Sharipov</strong>, Doctor of Technical Sciences, Professor, Kimyo International University in Tashkent</p>'
        + '<h2>Deputy Editor</h2>'
        + '<p class="editorial-member"><strong>Akmal Rustamov</strong>, PhD in Engineering, Associate Professor, Kimyo International University in Tashkent</p>'
        + '<h2>Editorial Board</h2>'
        + '<ul class="editorial-board-list">'
        + '<li><strong>Chikahiro Minova</strong>, DSc in Technical Sciences, Professor, Kimyo International University in Tashkent</li>'
        + '<li><strong>Savet Khudaikulov</strong>, Doctor of Technical Sciences, Professor, Kimyo International University in Tashkent</li>'
        + '<li><strong>Mokhiniso Khidirova</strong>, Doctor of Technical Sciences, Associate Professor, Kimyo International University in Tashkent</li>'
        + '<li><strong>Ibrokhim Rustamov</strong>, DSc in Technical Sciences, Kimyo International University in Tashkent</li>'
        + '<li><strong>Dzhambul Yusupov</strong>, DSc in Physics and Mathematics, Kimyo International University in Tashkent</li>'
        + '<li><strong>Sanzhar Ruzimov</strong>, DSc in Technical Sciences, Associate Professor, Turin Polytechnic University in Tashkent</li>'
        + '<li><strong>Dilbar Mirzarakmetova</strong>, Doctor of Biotechnology, Kimyo International University in Tashkent, Uzbekistan</li>'
        + '<li><strong>Hans Ochsner</strong>, DSc in Technical Sciences, Director, State Institute of Agricultural Engineering and Bioenergy, Germany</li>'
        + '<li><strong>Andreas Lemmer</strong>, DSc in Technical Sciences, Professor, State Institute of Agricultural Engineering and Bioenergy, Germany</li>'
        + '<li><strong>Bazarov Bakhtiyor Imomovich</strong>, DSc in Technical Sciences, Professor, Tashkent State Transport University</li>'
        + '<li><strong>Jamshid Kaniyev</strong>, PhD in Engineering, Kimyo International University in Tashkent</li>'
        + '<li><strong>Otabek Mukhiddinov</strong>, PhD in Engineering, Associate Professor, Kimyo International University in Tashkent</li>'
        + '<li><strong>Murodjon Sherbaev</strong>, PhD in Engineering, Associate Professor, Kimyo International University in Tashkent</li>'
        + '<li><strong>Sarvar Yusupov</strong>, PhD in Engineering, Kimyo International University in Tashkent</li>'
        + '<li><strong>Khammid Yusupov</strong>, PhD in Physics, Kimyo International University in Tashkent, Uzbekistan</li>'
        + '<li><strong>Igor Simone Steevano</strong>, PhD in Engineering, Politecnico di Torino, Italy</li>'
        + '</ul>',
    },
  };

  if (typeof window !== 'undefined') {
    window.__MUARRIX_ABOUT_EDITORIAL_PACK = pack;
  }
})();
