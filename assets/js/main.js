// Campus Lost & Found Client Interactions
document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic Detail Page Loading based on URL param
  const detailContainer = document.querySelector('.detail-item');
  if (detailContainer) {
    const params = new URLSearchParams(window.location.search);
    const barangId = params.get('barang');
    
    const itemsData = {
      '1': {
        title: 'Dompet Kulit Cokelat',
        location: 'Gedung A',
        time: '08.35',
        image: 'assets/images/dompet-cokelat.webp',
        alt: 'Foto Dompet Kulit Cokelat'
      },
      '2': {
        title: 'Kunci Motor & Gantungan',
        location: 'Parkiran Utama',
        time: '09.20',
        image: 'assets/images/kunci-motor.webp',
        alt: 'Foto Kunci Motor & Gantungan'
      },
      '3': {
        title: 'Botol Minum Hijau',
        location: 'Perpustakaan',
        time: '10.05',
        image: 'assets/images/botol-hijau.webp',
        alt: 'Foto Botol Minum Hijau'
      },
      '4': {
        title: 'Kalkulator Scientific',
        location: 'Gedung C',
        time: '11.40',
        image: 'assets/images/kalkulator.webp',
        alt: 'Foto Kalkulator Scientific'
      }
    };

    if (barangId && itemsData[barangId]) {
      const item = itemsData[barangId];
      const img = detailContainer.querySelector('img');
      const h2 = detailContainer.querySelector('h2');
      const pLokasi = detailContainer.querySelectorAll('p')[0];
      const pWaktu = detailContainer.querySelectorAll('p')[1];

      if (img) {
        img.src = item.image;
        img.alt = item.alt;
      }
      if (h2) h2.textContent = item.title;
      if (pLokasi) pLokasi.innerHTML = `<strong>Lokasi ditemukan:</strong> ${item.location}`;
      if (pWaktu) pWaktu.innerHTML = `<strong>Waktu ditemukan:</strong> ${item.time}`;
    }
  }

  // 2. Interactive Search & Filter on cari-barang.html
  const searchInput = document.querySelector('#q');
  const locationSelect = document.querySelector('#lokasi');
  const cards = document.querySelectorAll('.item-grid .item-card');
  const itemGrid = document.querySelector('.item-grid');

  if ((searchInput || locationSelect) && cards.length > 0) {
    // Check or create empty state element
    let emptyState = document.getElementById('search-empty-state');
    if (!emptyState && itemGrid) {
      emptyState = document.createElement('div');
      emptyState.id = 'search-empty-state';
      emptyState.style.display = 'none';
      emptyState.style.gridColumn = '1 / -1';
      emptyState.style.padding = '3rem 1.5rem';
      emptyState.style.textAlign = 'center';
      emptyState.style.background = '#ffffff';
      emptyState.style.border = '1px dashed #cbd5e1';
      emptyState.style.borderRadius = '10px';
      emptyState.innerHTML = `
        <h3 style="font-size: 1.125rem; color: #123356; margin-bottom: 0.5rem; font-weight: 700;">Barang tidak ditemukan</h3>
        <p style="color: #64748b; font-size: 0.9375rem; margin-bottom: 1rem;">Coba gunakan kata kunci lain atau pilih lokasi yang berbeda.</p>
        <a href="lapor-barang.html" style="display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0.5rem 1.25rem; background: #123356; color: #ffffff; border-radius: 6px; font-weight: 600; font-size: 0.875rem;">Buat Laporan Barang Hilang</a>
      `;
      itemGrid.appendChild(emptyState);
    }

    const filterItems = () => {
      const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const loc = (locationSelect ? locationSelect.value : '').toLowerCase().trim();
      let visibleCount = 0;

      cards.forEach(card => {
        const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
        const desc = (card.querySelector('p:nth-of-type(2)')?.textContent || '').toLowerCase();
        const cardLoc = (card.querySelector('p:first-of-type')?.textContent || '').toLowerCase();

        const matchQuery = !q || title.includes(q) || desc.includes(q);
        const matchLocation = !loc || cardLoc.includes(loc);

        if (matchQuery && matchLocation) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (emptyState) {
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    };

    if (searchInput) searchInput.addEventListener('input', filterItems);
    if (locationSelect) locationSelect.addEventListener('change', filterItems);

    // Initial check if URL has query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlQ = urlParams.get('q');
    const urlLoc = urlParams.get('lokasi');
    if (urlQ && searchInput) {
      searchInput.value = urlQ;
    }
    if (urlLoc && locationSelect) {
      locationSelect.value = urlLoc;
    }
    if (urlQ || urlLoc) {
      filterItems();
    }
  }

  // 3. Dynamic Tracking display on lacak-laporan.html
  const nomorInput = document.querySelector('#nomor');
  const trackingHeading = document.querySelector('.tracking-card h2');
  if (nomorInput && trackingHeading) {
    const params = new URLSearchParams(window.location.search);
    const nomor = params.get('nomor');
    if (nomor) {
      nomorInput.value = nomor;
      trackingHeading.textContent = `Status pelacakan: ${nomor}`;
    }
  }
});
