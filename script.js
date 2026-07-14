let currentStep = 1;
const totalSteps = 7;
let formDataGlobal = {};

// KONFIGURASI GOOGLE SHEETS
// Ganti dengan URL Google Apps Script Web App Anda
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwauXQPLahKWNx6Qbao6XEBL57BYkfJ_0rXyo-Q40rjYe2HLJUsBpueDepzztEGZXlyag/exec';

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const form = document.getElementById('spmbForm');
const modal = document.getElementById('successModal');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showStep(currentStep);
    updateButtons();
    
    // Image preview
    document.getElementById('fotoSelfie').addEventListener('change', handleImagePreview);
});

// Navigation
prevBtn.addEventListener('click', () => {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateButtons();
    }
});

nextBtn.addEventListener('click', () => {
    if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
            updateButtons();
        }
    }
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (validateStep(currentStep)) {
        try {
            const formData = new FormData(form);
            formDataGlobal = Object.fromEntries(formData.entries());
            
            // Add timestamp
            formDataGlobal.tanggalDaftar = new Date().toLocaleString('id-ID');
            
            // Get photo as base64
            const photoFile = document.getElementById('fotoSelfie').files[0];
            if (photoFile) {
                formDataGlobal.fotoBase64 = await fileToBase64(photoFile);
            }
            
            console.log('Form Data:', formDataGlobal);
            
            // Send to Google Sheets
            await sendToGoogleSheets(formDataGlobal);
            
            // Show success modal
            showModal();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
        }
    }
});

// Modal handlers
closeModalBtn.addEventListener('click', () => {
    hideModal();
    resetForm();
});

downloadPdfBtn.addEventListener('click', () => {
    generatePDF(formDataGlobal);
});

function showModal() {
    modal.classList.add('show');
}

function hideModal() {
    modal.classList.remove('show');
}

function resetForm() {
    form.reset();
    currentStep = 1;
    showStep(currentStep);
    updateButtons();
    document.getElementById('imagePreview').innerHTML = '';
    formDataGlobal = {};
}

function showStep(step) {
    // Hide all steps
    const steps = document.querySelectorAll('.form-step');
    steps.forEach(s => s.classList.remove('active'));
    
    // Show current step
    const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    // Update progress indicator
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((ps, index) => {
        ps.classList.remove('active', 'completed');
        if (index + 1 < step) {
            ps.classList.add('completed');
        } else if (index + 1 === step) {
            ps.classList.add('active');
        }
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateButtons() {
    // Previous button
    prevBtn.style.display = currentStep === 1 ? 'none' : 'block';
    
    // Next button
    nextBtn.style.display = currentStep === totalSteps ? 'none' : 'block';
    
    // Submit button
    submitBtn.style.display = currentStep === totalSteps ? 'block' : 'none';
}

function validateStep(step) {
    const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    const inputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
    
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#e74c3c';
            
            // Remove error styling after user starts typing
            input.addEventListener('input', function() {
                this.style.borderColor = '#e0e0e0';
            }, { once: true });
        }
    });
    
    if (!isValid) {
        alert('Mohon lengkapi semua field yang wajib diisi (*)');
    }
    
    return isValid;
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            preview.innerHTML = `<img src="${event.target.result}" alt="Preview Foto">`;
        };
        
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Send data to Google Sheets
async function sendToGoogleSheets(data) {
    try {
        // Skip if URL not configured
        if (GOOGLE_SCRIPT_URL === 'MASUKKAN_URL_GOOGLE_APPS_SCRIPT_ANDA_DISINI') {
            console.log('Google Sheets URL belum dikonfigurasi');
            return;
        }

        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log('Data berhasil dikirim ke Google Sheets');
    } catch (error) {
        console.error('Error mengirim ke Google Sheets:', error);
    }
}

// Generate PDF
async function generatePDF(data) {
    try {
        // Check if libraries are loaded
        if (typeof window.jspdf === 'undefined') {
            alert('Library PDF belum ter-load. Silakan refresh halaman dan coba lagi.');
            return;
        }
        
        if (typeof html2canvas === 'undefined') {
            alert('Library html2canvas belum ter-load. Silakan refresh halaman dan coba lagi.');
            return;
        }
        
        console.log('Starting PDF generation...');
        
        // Helper function to safely set text content
        const setTextContent = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || '';
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };
        
        // Populate PDF template
        setTextContent('pdf-nama', data.nama);
        setTextContent('pdf-nisn', data.nisn);
        setTextContent('pdf-ttl', `${data.tempatLahir || ''}, ${formatDate(data.tanggalLahir) || ''}`);
        setTextContent('pdf-jenisKelamin', data.jenisKelamin);
        setTextContent('pdf-agama', data.agama);
        setTextContent('pdf-alamat', data.alamat);
        setTextContent('pdf-alamat2', data.alamat);
        setTextContent('pdf-statusKeluarga', data.statusKeluarga);
        setTextContent('pdf-anakKe', data.anakKe);
        setTextContent('pdf-nomorHP', data.nomorHP);
        setTextContent('pdf-sekolahAsal', data.sekolahAsal);
        setTextContent('pdf-nomorKK', data.nomorKK);
        setTextContent('pdf-nikAyah', data.nikAyah);
        setTextContent('pdf-namaAyah', data.namaAyah);
        setTextContent('pdf-pekerjaanAyah', data.pekerjaanAyah);
        setTextContent('pdf-pendidikanAyah', data.pendidikanAyah);
        setTextContent('pdf-nikIbu', data.nikIbu);
        setTextContent('pdf-namaIbu', data.namaIbu);
        setTextContent('pdf-pekerjaanIbu', data.pekerjaanIbu);
        setTextContent('pdf-pendidikanIbu', data.pendidikanIbu);
        
        // Format tanggal untuk signature
        const today = new Date();
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const tanggalShort = `${today.getDate()} ${months[today.getMonth()]}`;
        setTextContent('pdf-tanggal-short', tanggalShort);
        
        // Set foto
        const fotoImg = document.getElementById('pdf-foto');
        if (fotoImg) {
            if (data.fotoBase64) {
                fotoImg.src = data.fotoBase64;
                fotoImg.style.display = 'block';
            } else {
                fotoImg.style.display = 'none';
            }
        }

        console.log('Data populated, generating canvas...');

        // Show PDF template temporarily
        const pdfTemplate = document.getElementById('pdfTemplate');
        if (!pdfTemplate) {
            alert('Template PDF tidak ditemukan!');
            return;
        }
        
        pdfTemplate.style.left = '0';
        pdfTemplate.style.top = '0';
        pdfTemplate.style.position = 'fixed';
        pdfTemplate.style.zIndex = '-1';
        
        // Wait a bit for rendering
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Capture PDF template
        const canvas = await html2canvas(pdfTemplate, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 815,
            height: 1248
        });
        
        console.log('Canvas generated, creating PDF...');
        
        // Hide template again
        pdfTemplate.style.left = '-9999px';
        pdfTemplate.style.position = 'absolute';
        pdfTemplate.style.zIndex = '';
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Generate PDF using jsPDF - F4/Legal size
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [215.9, 330.2]
        });
        
        // Add to PDF - fit to F4 page
        pdf.addImage(imgData, 'JPEG', 0, 0, 215.9, 330.2);
        
        console.log('PDF created, downloading...');
        
        // Save PDF
        const fileName = `Formulir_SPMB_${data.nama || 'Siswa'}.pdf`;
        pdf.save(fileName);
        
        console.log('PDF downloaded successfully!');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Terjadi kesalahan saat membuat PDF: ' + error.message + '\n\nSilakan coba lagi atau hubungi administrator.');
    }
}

// Format date to Indonesian format
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

