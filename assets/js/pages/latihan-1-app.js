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
                    title: 'Tantangan 1: Kalkulator Pajak',
                    scenario: 'Kamu sedang membangun fitur kasir. Buat fungsi untuk menghitung total harga + pajak 11%.',
                    tasks: [
                        'Buat fungsi bernama hitungTotal',
                        'Terima parameter hargaProduk',
                        'Return hasil (hargaProduk + (hargaProduk * 0.11))'
                    ],
                    starter: `function hitungTotal(hargaProduk) {\n  // Tulis kodemu di sini\n  \n}`,
                    expectedOutput: 111000,
                    correction: "Gunakan return hargaProduk + (hargaProduk * 0.11). Pastikan fungsi mengembalikan angka total, bukan hanya console.log.",
                    test: (code) => {
                        try {
                            const fn = new Function(`return ${code}`)();
                            if (typeof fn !== 'function') return { ok: false, msg: 'Pastikan kamu menulis fungsi dengan benar.' };
                            const res = fn(100000);
                            return res === 111000
                                ? { ok: true, msg: 'Keren! Perhitungan pajak 11% sudah tepat.' }
                                : { ok: false, msg: `Hasil salah. Ekspektasi: 111000, Hasilmu: ${res}` };
                        } catch (e) {
                            return { ok: false, msg: 'Error: ' + e.message };
                        }
                    }
                },
                {
                    title: 'Tantangan 2: Filter Akses Konten',
                    scenario: "Hanya user 'premium' ATAU umur >= 18 yang bisa menonton. Gunakan Early Return.",
                    tasks: [
                        'Buat fungsi cekIzinTonton(umur, isPremium)',
                        "Jika isPremium, return 'Akses Diberikan (Member)'",
                        "Jika umur >= 18, return 'Akses Diberikan (Cukup Umur)'",
                        "Selain itu, return 'Akses Ditolak'"
                    ],
                    starter: `function cekIzinTonton(umur, isPremium) {\n  // Gunakan Early Return Pattern\n  \n}`,
                    correction: "Pakai urutan early return: cek isPremium dulu, lalu cek umur >= 18, terakhir return 'Akses Ditolak'.",
                    test: (code) => {
                        try {
                            const fn = new Function(`return ${code}`)();
                            const t1 = fn(15, true) === 'Akses Diberikan (Member)';
                            const t2 = fn(20, false) === 'Akses Diberikan (Cukup Umur)';
                            const t3 = fn(12, false) === 'Akses Ditolak';

                            if (t1 && t2 && t3) return { ok: true, msg: 'Mantap! Logika Early Return kamu sangat rapi.' };
                            return { ok: false, msg: 'Logika belum sepenuhnya benar. Cek kembali kondisi if/else kamu.' };
                        } catch (e) {
                            return { ok: false, msg: 'Error: ' + e.message };
                        }
                    }
                },
                {
                    title: 'Tantangan 3: Power-Up Shadowing',
                    scenario: 'Tunjukkan bahwa variabel global tidak berubah meskipun parameter di dalam fungsi dimanipulasi.',
                    tasks: [
                        "Parameter 'power' harus ditambah 100",
                        'Lakukan console.log(power) di dalam fungsi',
                        'Pastikan variabel global di luar tetap 50'
                    ],
                    starter: `let power = 50;\n\nfunction aktifkanBuff(power) {\n  // Tambahkan power dengan 100\n  \n  console.log('Di dalam:', power);\n}\n\naktifkanBuff(power);\nconsole.log('Di luar:', power);`,
                    correction: "Di dalam fungsi, ubah parameter power menjadi power += 100 lalu log. Jangan ubah variabel global langsung agar nilai di luar tetap 50.",
                    test: (code) => {
                        let originalConsoleLog = null;
                        try {
                            const logs = [];
                            originalConsoleLog = console.log;
                            // Mock console log untuk menangkap output user
                            console.log = (m, v) => logs.push(v !== undefined ? v : m);

                            // Menjalankan kode dalam global scope
                            (0, eval)(code);

                            console.log = originalConsoleLog;

                            const inside = logs.find((l) => l === 150);
                            const outside = logs[logs.length - 1];

                            if (inside && outside === 50) return { ok: true, msg: 'Sempurna! Kamu berhasil membuktikan efek Shadowing.' };
                            return { ok: false, msg: 'Coba cek lagi. Apakah power di dalam sudah jadi 150 dan yang di luar tetap 50?' };
                        } catch (e) {
                            if (originalConsoleLog) {
                                console.log = originalConsoleLog;
                            }
                            return { ok: false, msg: 'Error: ' + e.message };
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
                <div id="latihan1-app" className="bg-slate-50 text-slate-900 font-sans p-4 md:p-8 rounded-3xl border border-slate-200 shadow-lg">
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
                                        {activeStep === 0 && "Jangan lupa menggunakan kata kunci 'return' agar nilai bisa keluar dari mesin fungsi."}
                                        {activeStep === 1 && "Gunakan 'return' langsung setelah 'if'. Jika kondisi terpenuhi, baris di bawahnya tidak akan dieksekusi."}
                                        {activeStep === 2 && "Ingat, parameter 'power' di dalam fungsi adalah variabel yang berbeda dengan 'power' di luar (global)."}
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
    
