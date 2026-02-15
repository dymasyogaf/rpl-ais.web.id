        const { useState, useEffect } = React;

        const App = () => {
            const [activeStep, setActiveStep] = useState(0);
            const [userCode, setUserCode] = useState('');
            const [output, setOutput] = useState([]);
            const [status, setStatus] = useState('idle'); // idle, success, error
            const [feedback, setFeedback] = useState('');
            const [completedSteps, setCompletedSteps] = useState([]);
            const [finalScore, setFinalScore] = useState(null);
            const [showPreview, setShowPreview] = useState(false);
            const [submissions, setSubmissions] = useState({});

            const challenges = [
                {
                    title: 'Tantangan 1: Si Robot Penyapa',
                    scenario: 'Bikin robot resepsionis yang menyapa tamu saat fungsi dipanggil.',
                    tasks: [
                        'Buat fungsi bernama sapaTamu',
                        "Di dalamnya, console.log('Selamat datang, Silakan masuk!')",
                        'Panggil fungsi sapaTamu'
                    ],
                    starter: `// 1. Buat fungsi sapaTamu di sini\nfunction sapaTamu() {\n  // Tulis kodemu di sini\n  \n}\n\n// 2. Panggil fungsinya di bawah ini\n`,
                    expectedOutput: 'Selamat datang, Silakan masuk!',
                    correction: "Pastikan fungsi dipanggil dan isi log persis: 'Selamat datang, Silakan masuk!'.",
                    test: (code) => {
                        const logs = [];
                        const originalConsoleLog = console.log;
                        try {
                            console.log = (...args) => logs.push(args.join(' '));
                            new Function(code)();
                            const combined = logs.join(' ');
                            if (combined.includes('Selamat datang, Silakan masuk!')) {
                                return { ok: true, msg: 'Mantap, robot kamu sudah bisa menyapa tamu.' };
                            }
                            return { ok: false, msg: "Output belum sesuai. Pastikan muncul 'Selamat datang, Silakan masuk!'." };
                        } catch (e) {
                            return { ok: false, msg: 'Error: ' + e.message };
                        } finally {
                            console.log = originalConsoleLog;
                        }
                    }
                },
                {
                    title: 'Tantangan 2: Mesin Kopi Otomatis',
                    scenario: 'Mesin kopi perlu menuliskan nama pelanggan pada output.',
                    tasks: [
                        'Buat fungsi buatKopi(nama)',
                        "Di dalam fungsi, log 'Kopi siap untuk ' + nama",
                        "Panggil fungsi dengan argumen 'Budi'"
                    ],
                    starter: `// Buat fungsi dengan parameter nama\nfunction buatKopi(nama) {\n  console.log(\"Kopi siap untuk \" + nama);\n}\n\n// Panggil fungsi untuk pelanggan bernama 'Budi'\n// ... tulis kodemu ...\n`,
                    expectedOutput: 'Kopi siap untuk Budi',
                    correction: "Pastikan ada pemanggilan fungsi dengan argumen 'Budi'.",
                    test: (code) => {
                        const logs = [];
                        const originalConsoleLog = console.log;
                        try {
                            console.log = (...args) => logs.push(args.join(' '));
                            new Function(code)();
                            const combined = logs.join(' ');
                            if (combined.includes('Kopi siap untuk Budi')) {
                                return { ok: true, msg: 'Sip, fungsi parameter kamu sudah benar.' };
                            }
                            return { ok: false, msg: "Output belum sesuai. Cek lagi pemanggilan fungsi untuk nama 'Budi'." };
                        } catch (e) {
                            return { ok: false, msg: 'Error: ' + e.message };
                        } finally {
                            console.log = originalConsoleLog;
                        }
                    }
                },
                {
                    title: 'Tantangan 3: Kalkulator Diskon Toko',
                    scenario: 'Hitung harga setelah diskon Rp1000 menggunakan nilai return.',
                    tasks: [
                        'Buat fungsi potongHarga(harga)',
                        'Return harga - 1000',
                        'Simpan hasil potongHarga(5000) lalu log hasilnya'
                    ],
                    starter: `function potongHarga(harga) {\n  // Gunakan keyword 'return'\n  return harga - 1000;\n}\n\n// Panggil fungsi, simpan di variabel, lalu console.log hasilnya\nlet hargaAsli = 5000;\nlet hargaAkhir = ...; // panggil fungsi di sini\n\nconsole.log(hargaAkhir);`,
                    expectedOutput: '4000',
                    correction: 'Jangan lupa menampung nilai return ke variabel hargaAkhir lalu console.log.',
                    test: (code) => {
                        const logs = [];
                        const originalConsoleLog = console.log;
                        try {
                            console.log = (...args) => logs.push(args.join(' '));
                            new Function(code)();
                            const combined = logs.join(' ');
                            if (combined.includes('4000')) {
                                return { ok: true, msg: 'Benar, hasil diskon sudah 4000.' };
                            }
                            return { ok: false, msg: 'Output belum 4000. Cek lagi fungsi return dan pemanggilannya.' };
                        } catch (e) {
                            return { ok: false, msg: 'Error: ' + e.message };
                        } finally {
                            console.log = originalConsoleLog;
                        }
                    }
                },
                {
                    title: 'Tantangan 4: Misteri Variabel Hilang',
                    scenario: 'Perbaiki error scope agar pesan rahasia bisa ditampilkan.',
                    tasks: [
                        'Perbaiki akses variabel pesanRahasia',
                        'Boleh pindahkan console.log ke dalam fungsi',
                        'Atau ubah variabel jadi global asalkan output benar'
                    ],
                    starter: `function bukaBrankas() {\n  let pesanRahasia = \"Kode Rahasia: 12345\";\n  // Pindahkan console.log ke baris ini agar bisa baca variabel\n}\n\nbukaBrankas();\n// Baris di bawah ini error karena 'pesanRahasia' tidak dikenal di luar\nconsole.log(pesanRahasia); `,
                    expectedOutput: 'Kode Rahasia: 12345',
                    correction: 'Masalahnya ada di scope variabel. Pastikan log tidak mengambil variabel lokal dari luar fungsi.',
                    test: (code) => {
                        const logs = [];
                        const originalConsoleLog = console.log;
                        try {
                            console.log = (...args) => logs.push(args.join(' '));
                            new Function(code)();
                            const combined = logs.join(' ');
                            if (combined.includes('Kode Rahasia: 12345')) {
                                return { ok: true, msg: 'Bagus, error scope berhasil kamu perbaiki.' };
                            }
                            return { ok: false, msg: "Output belum menampilkan 'Kode Rahasia: 12345'." };
                        } catch (e) {
                            return { ok: false, msg: 'Masih error. Cek lagi scope variabel: ' + e.message };
                        } finally {
                            console.log = originalConsoleLog;
                        }
                    }
                },
                {
                    title: 'Tantangan 5: Upgrade ke Arrow Function',
                    scenario: 'Ubah fungsi biasa menjadi arrow function tanpa mengubah output.',
                    tasks: [
                        'Ubah function hitungLuas menjadi arrow function',
                        'Pastikan hasil hitungLuas(5) tetap 25',
                        "Gunakan sintaks panah '=>'"
                    ],
                    starter: `// Ubah fungsi ini menjadi Arrow Function\n// const hitungLuas = (sisi) => { ... }\n\nfunction hitungLuas(sisi) {\n  return sisi * sisi;\n}\n\nconsole.log(hitungLuas(5));`,
                    expectedOutput: '25',
                    correction: "Output harus 25 dan kode harus memakai sintaks '=>'.",
                    test: (code) => {
                        const logs = [];
                        const originalConsoleLog = console.log;
                        try {
                            console.log = (...args) => logs.push(args.join(' '));
                            new Function(code)();
                            const combined = logs.join(' ');
                            if (!code.includes('=>')) {
                                return { ok: false, msg: "Output mungkin benar, tapi kamu belum pakai arrow function (=>)." };
                            }
                            if (combined.includes('25')) {
                                return { ok: true, msg: 'Keren, arrow function kamu sudah sesuai.' };
                            }
                            return { ok: false, msg: 'Output belum 25. Cek kembali rumus luas persegi.' };
                        } catch (e) {
                            return { ok: false, msg: 'Error: ' + e.message };
                        } finally {
                            console.log = originalConsoleLog;
                        }
                    }
                }
            ];

            useEffect(() => {
                setUserCode(challenges[activeStep].starter);
                setFeedback('');
                setStatus('idle');
                setOutput([]);
            }, [activeStep]);

            const runCode = () => {
                setOutput(['Menjalankan kode...']);
                const result = challenges[activeStep].test(userCode);
                const nextCompleted = result.ok
                    ? (completedSteps.includes(activeStep) ? completedSteps : [...completedSteps, activeStep])
                    : completedSteps;
                const isAllDoneNow = result.ok && nextCompleted.length === challenges.length;
                const currentSubmission = {
                    code: userCode,
                    ok: result.ok,
                    message: result.msg
                };

                setTimeout(() => {
                    setSubmissions((prev) => ({
                        ...prev,
                        [activeStep]: currentSubmission
                    }));

                    if (result.ok) {
                        setCompletedSteps(nextCompleted);
                        setStatus('success');
                        if (isAllDoneNow) {
                            setFinalScore(100);
                            setShowPreview(true);
                            setFeedback('Semua tantangan selesai! Nilai akhir kamu: 100/100.');
                            setOutput(['PASS Test Passed', result.msg, 'NILAI AKHIR: 100/100']);
                        } else {
                            setFeedback(result.msg);
                            setOutput(['PASS Test Passed', result.msg]);
                        }
                    } else {
                        setStatus('error');
                        setFeedback(result.msg);
                        setOutput(['FAIL Test Failed', result.msg]);
                    }
                }, 500);
            };

            const resetCode = () => {
                setUserCode(challenges[activeStep].starter);
                setStatus('idle');
                setFeedback('');
                setOutput([]);
            };

            const resetProgress = () => {
                setCompletedSteps([]);
                setFinalScore(null);
                setShowPreview(false);
                setSubmissions({});
                setActiveStep(0);
                setUserCode(challenges[0].starter);
                setStatus('idle');
                setFeedback('');
                setOutput([]);
            };

            const progressPercent = Math.round((completedSteps.length / challenges.length) * 100);
            const isAllCompleted = completedSteps.length === challenges.length;

            return (
                <div id="latihan2-app" className="bg-slate-50 text-slate-900 font-sans p-4 md:p-8 rounded-3xl border border-slate-200 shadow-lg">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-2 rounded-full w-fit shadow-sm border border-slate-100">
                            {challenges.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${activeStep === idx ? 'bg-indigo-600 text-white shadow-md scale-110' :
                                        completedSteps.includes(idx) ? 'bg-emerald-500 text-white' : 'text-slate-400'
                                        }`}
                                >
                                    {completedSteps.includes(idx) ? <i className="fa-solid fa-circle-check text-xs" aria-hidden="true"></i> : idx + 1}
                                </div>
                            ))}
                        </div>

                        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                    <h2 className="text-2xl font-bold mb-4 text-indigo-900">{challenges[activeStep].title}</h2>
                                    <p className="text-slate-600 mb-6 leading-relaxed italic">"{challenges[activeStep].scenario}"</p>

                                    <div className="space-y-3">
                                        <p className="font-bold text-sm text-slate-400 uppercase">Tugasmu:</p>
                                        {challenges[activeStep].tasks.map((task, i) => (
                                            <div key={i} className="flex gap-3 items-start group">
                                                <div className="mt-1 bg-indigo-50 text-indigo-600 p-1 rounded group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <i className="fa-solid fa-chevron-right text-xs" aria-hidden="true"></i>
                                                </div>
                                                <span className="text-slate-700 text-sm leading-snug">{task}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {status === 'success' && (
                                        <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-bounce">
                                            <i className="fa-solid fa-trophy text-emerald-500" aria-hidden="true"></i>
                                            <p className="text-sm font-bold text-emerald-700">
                                                {isAllCompleted
                                                    ? `Semua tantangan selesai! Nilai akhir: ${finalScore || 100}/100`
                                                    : 'Luar biasa! Lanjut ke tantangan berikutnya?'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                                    <div className="flex items-center gap-2 mb-2 text-amber-700">
                                        <i className="fa-solid fa-lightbulb" aria-hidden="true"></i>
                                        <span className="font-bold text-sm uppercase">Tips Mentor</span>
                                    </div>
                                    <p className="text-sm text-amber-800 leading-relaxed">
                                        {activeStep === 0 && "Pastikan fungsi benar-benar dipanggil, bukan cuma dideklarasikan."}
                                        {activeStep === 1 && "Kalau pakai parameter, cek lagi nilai argumen saat memanggil fungsi."}
                                        {activeStep === 2 && "Fokus di return value: hasil fungsi harus dipakai lagi di luar fungsi."}
                                        {activeStep === 3 && "Masalah di soal ini ada di scope. Variabel lokal tidak bisa diakses dari luar fungsi."}
                                        {activeStep === 4 && "Selain output benar, pastikan ada sintaks panah (=>) di kode kamu."}
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-500 uppercase">Progress Nilai</p>
                                        <span className="text-sm font-extrabold text-indigo-700">{progressPercent}%</span>
                                    </div>
                                    <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3">
                                        {completedSteps.length}/{challenges.length} tantangan selesai.
                                    </p>
                                    <button
                                        onClick={() => setShowPreview(true)}
                                        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                                    >
                                        Preview Jawaban
                                    </button>
                                </div>
                            </div>

                            <div className="lg:col-span-8 space-y-4">
                                <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                                    <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-400" />
                                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                        </div>
                                        <span className="text-xs font-mono text-slate-400">solution.js</span>
                                    </div>

                                    <textarea
                                        value={userCode}
                                        onChange={(e) => setUserCode(e.target.value)}
                                        className="w-full h-64 p-6 bg-slate-900 text-emerald-400 font-mono text-sm focus:outline-none resize-none"
                                        spellCheck="false"
                                    />

                                    <div className="px-6 py-4 bg-slate-800 border-t border-slate-700 flex justify-between items-center">
                                        <button
                                            onClick={resetCode}
                                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                                        >
                                            <i className="fa-solid fa-rotate-right text-sm" aria-hidden="true"></i> Reset
                                        </button>
                                        <button
                                            onClick={runCode}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
                                        >
                                            <i className="fa-solid fa-play text-sm" aria-hidden="true"></i> Run Code
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-2 mb-3 text-slate-400">
                                        <i className="fa-solid fa-terminal text-sm" aria-hidden="true"></i>
                                        <span className="text-xs font-bold uppercase tracking-widest">Console Output</span>
                                    </div>
                                    <div className="space-y-1 font-mono text-sm min-h-[60px]">
                                        {output.length === 0 ? (
                                            <span className="text-slate-300 italic">Belum ada output...</span>
                                        ) : (
                                            output.map((line, i) => (
                                                <div key={i} className={line.startsWith('PASS') ? 'text-emerald-600 font-bold' : line.startsWith('FAIL') ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                                    {line}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                    <button
                                        onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                                        disabled={activeStep === 0}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeStep === 0 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <i className="fa-solid fa-chevron-left" aria-hidden="true"></i> Kembali
                                    </button>

                                    <button
                                        onClick={() => setActiveStep((s) => Math.min(challenges.length - 1, s + 1))}
                                        disabled={activeStep === challenges.length - 1 || status !== 'success'}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${status === 'success' && activeStep !== challenges.length - 1
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        Lanjut <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                                    </button>
                                </div>

                                {isAllCompleted && (
                                    <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <p className="text-sm uppercase tracking-wider font-semibold text-emerald-100">Hasil Akhir</p>
                                            <p className="text-2xl font-extrabold">Nilai Kamu: {finalScore || 100}/100</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowPreview(true)}
                                                className="px-4 py-2 rounded-xl bg-white text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-colors"
                                            >
                                                Preview
                                            </button>
                                            <button
                                                onClick={resetProgress}
                                                className="px-4 py-2 rounded-xl border border-white/60 text-white font-bold text-sm hover:bg-white/10 transition-colors"
                                            >
                                                Ulang dari Awal
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>

                    {showPreview && (
                        <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm px-4 py-8 overflow-y-auto">
                            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 md:p-8">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase font-bold tracking-widest text-emerald-600">Preview Jawaban</p>
                                        <h3 className="text-2xl font-extrabold text-slate-900 mt-2">Nilai: {isAllCompleted ? (finalScore || 100) : progressPercent}/100</h3>
                                        <p className="text-sm text-slate-500 mt-2">
                                            {isAllCompleted
                                                ? 'Semua tantangan sudah selesai.'
                                                : 'Lihat jawaban yang sudah dikumpulkan. Jika salah, koreksi ada di bawah jawaban.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
                                        aria-label="Tutup preview"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>

                                <div className="mt-6 space-y-4">
                                    {challenges.map((challenge, idx) => {
                                        const review = submissions[idx];
                                        const passed = review ? review.ok : completedSteps.includes(idx);
                                        return (
                                            <div key={idx} className="rounded-2xl border border-slate-200 px-4 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{challenge.title}</p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {!review ? 'Belum ada submit' : passed ? 'Jawaban benar' : 'Perlu perbaikan'}
                                                        </p>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full ${passed ? 'bg-emerald-100 text-emerald-700' : review ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        <i className={`fa-solid ${passed ? 'fa-circle-check' : review ? 'fa-triangle-exclamation' : 'fa-clock'}`} aria-hidden="true"></i>
                                                        {passed ? 'Lulus' : review ? 'Salah' : 'Pending'}
                                                    </span>
                                                </div>

                                                <div className="mt-3 rounded-xl bg-slate-900 p-3 text-emerald-300 overflow-x-auto">
                                                    <pre className="text-xs leading-relaxed whitespace-pre-wrap">
                                                        {review ? review.code : '// Belum ada jawaban untuk tantangan ini.'}
                                                    </pre>
                                                </div>

                                                {review && !passed && (
                                                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                                                        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Koreksi</p>
                                                        <p className="text-sm text-rose-700 mt-1">{review.message}</p>
                                                        <p className="text-sm text-rose-800 mt-2">{challenge.correction}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold"
                                    >
                                        Tutup Preview
                                    </button>
                                    <a
                                        href="index.html"
                                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold"
                                    >
                                        Kembali ke Daftar Latihan
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    
