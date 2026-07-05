import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, LinearProgress, IconButton,
  Chip, Grid
} from '@mui/material';
import {
  UploadCloud, FileText, CheckCircle2, X, ScanLine, Cpu, Brain,
  Database, Mail, GraduationCap, Briefcase, Code2, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadCV } from '../services/api';

const STEPS = {
  queued: 'En attente',
  uploading: 'Envoi du fichier',
  ocr: 'Extraction PDF (pdfplumber)',
  nlp: 'Analyse NER (spaCy)',
  done: 'Analysé',
  error: 'Erreur',
};
const STEP_ORDER = ['queued', 'uploading', 'ocr', 'nlp', 'done'];

function nowStamp() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

export default function UploadCV() {
  const [items, setItems] = useState([]);
  const [drag, setDrag] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const navigate = useNavigate();

  const updateItem = useCallback((id, patch) => {
    setItems(prev => prev.map(i => i.id === id ? patch(i) : i));
  }, []);

  const log = useCallback((id, line) => {
    updateItem(id, i => ({ ...i, logs: [...i.logs, { t: nowStamp(), line }] }));
  }, [updateItem]);

  const runPipeline = useCallback(async (item, file) => {
    const id = item.id;
    const wait = ms => new Promise(r => setTimeout(r, ms));

    updateItem(id, i => ({ ...i, status: 'uploading', progress: 15 }));
    log(id, `📤 Envoi de ${item.name} vers le serveur...`);
    await wait(400);

    updateItem(id, i => ({ ...i, status: 'ocr', progress: 35 }));
    log(id, `📄 Extraction du texte brut via pdfplumber...`);

    try {
      const res = await uploadCV(file);
      const candidate = res.data.candidate;

      updateItem(id, i => ({ ...i, status: 'nlp', progress: 65 }));
      log(id, `🧠 Modèle spaCy NER appliqué...`);
      await wait(300);
      log(id, `   → Nom: ${candidate.name}`);
      updateItem(id, i => ({ ...i, extracted: { ...i.extracted, name: candidate.name }, progress: 72 }));
      await wait(200);
      log(id, `   → Email: ${candidate.email || '—'}`);
      updateItem(id, i => ({ ...i, extracted: { ...i.extracted, email: candidate.email }, progress: 78 }));
      await wait(200);
      log(id, `   → Diplôme: ${candidate.education || '—'}`);
      updateItem(id, i => ({ ...i, extracted: { ...i.extracted, degree: candidate.education }, progress: 84 }));
      await wait(200);
      log(id, `   → Expérience: ${candidate.experience_years} an(s)`);
      updateItem(id, i => ({ ...i, extracted: { ...i.extracted, experience: `${candidate.experience_years} an(s)` }, progress: 90 }));

      for (let k = 0; k < (candidate.skills_extracted || []).length; k++) {
        await wait(120);
        const sk = candidate.skills_extracted[k];
        log(id, `   ✓ Compétence détectée: ${sk}`);
        updateItem(id, i => ({
          ...i,
          extracted: { ...i.extracted, skills: [...i.extracted.skills, sk] },
          progress: Math.min(98, 90 + k)
        }));
      }

      log(id, `✅ Candidat enregistré avec succès en base de données.`);
      updateItem(id, i => ({ ...i, status: 'done', progress: 100, candidateId: candidate.id }));

    } catch (err) {
      log(id, `❌ Erreur: ${err.response?.data?.detail || 'Échec de l\'analyse'}`);
      updateItem(id, i => ({ ...i, status: 'error', progress: 100 }));
    }
  }, [updateItem, log]);

  const addFiles = useCallback((fileList) => {
    const list = Array.from(fileList).filter(f => f.name.endsWith('.pdf'));
    if (list.length === 0) return;

    const news = list.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: `${Math.max(1, (f.size / 1024) | 0)} Ko`,
      progress: 0,
      status: 'queued',
      logs: [],
      extracted: { skills: [] },
      file: f,
    }));
    setItems(prev => [...news, ...prev]);
    if (news[0]) setActiveId(news[0].id);
    news.forEach((item, idx) => setTimeout(() => runPipeline(item, item.file), idx * 400));
  }, [runPipeline]);

  const active = useMemo(() => items.find(i => i.id === activeId) ?? items[0], [items, activeId]);
  useEffect(() => { if (!activeId && items[0]) setActiveId(items[0].id); }, [items, activeId]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111418', letterSpacing: '-0.02em' }}>
            Studio d'extraction
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#6b7280', mt: 0.3 }}>
            Déposez un ou plusieurs CV — l'extraction se déroule en direct sous vos yeux
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate('/candidates')}
          sx={{
            textTransform: 'none', fontWeight: 600, borderRadius: '10px',
            borderColor: 'rgba(17,20,24,0.15)', color: '#111418',
          }}
        >
          Voir les candidats
        </Button>
      </Box>

      {/* Dropzone */}
      <motion.div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        animate={{ scale: drag ? 1.01 : 1 }}
      >
        <Box sx={{
          position: 'relative', border: '2px dashed',
          borderColor: drag ? '#FF7900' : 'rgba(17,20,24,0.10)',
          borderRadius: 4, p: { xs: 3.5, md: 5 }, textAlign: 'center',
          background: drag ? 'rgba(255,121,0,0.06)' : 'rgba(255,255,255,0.6)',
          transition: 'all .25s', overflow: 'hidden',
        }}>
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
            <Box sx={{
              width: 72, height: 72, mx: 'auto', borderRadius: '50%',
              display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg, #FF7900, #ff9a3c)',
              color: '#fff', boxShadow: '0 18px 40px rgba(255,121,0,0.25)',
            }}>
              <UploadCloud size={28} />
            </Box>
          </motion.div>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 2 }}>Glissez vos CV ici</Typography>
          <Typography sx={{ color: '#6b7280', mt: 0.6 }}>
            PDF uniquement — analyse en temps réel via pdfplumber + spaCy
          </Typography>
          <Button component="label" variant="contained" sx={{
            mt: 2, background: '#FF7900', '&:hover': { background: '#e06800' },
            textTransform: 'none', fontWeight: 700, borderRadius: '10px',
          }} startIcon={<UploadCloud size={16} />}>
            Parcourir
            <input hidden type="file" multiple accept=".pdf"
              onChange={e => e.target.files && addFiles(e.target.files)} />
          </Button>
        </Box>
      </motion.div>

      {items.length > 0 && (
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>

          {/* File queue */}
          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid rgba(17,20,24,0.07)', p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>File d'attente ({items.length})</Typography>
                <Button size="small" onClick={() => { setItems([]); setActiveId(null); }}
                  sx={{ textTransform: 'none', color: '#FF7900' }}>
                  Effacer
                </Button>
              </Box>
              <Box sx={{ maxHeight: 520, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <AnimatePresence>
                  {items.map(f => {
                    const isActive = f.id === activeId;
                    return (
                      <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}>
                        <Box onClick={() => setActiveId(f.id)} sx={{
                          cursor: 'pointer', p: 1.2, borderRadius: 2,
                          border: isActive ? '1px solid rgba(255,121,0,0.5)' : '1px solid rgba(17,20,24,0.05)',
                          background: isActive ? 'rgba(255,121,0,0.06)' : 'transparent',
                          display: 'flex', gap: 1.2, alignItems: 'center',
                        }}>
                          <Box sx={{
                            width: 34, height: 34, borderRadius: 1.4,
                            background: 'rgba(255,121,0,0.10)', color: '#FF7900',
                            display: 'grid', placeItems: 'center', flexShrink: 0,
                          }}>
                            {f.status === 'done' ? <CheckCircle2 size={16} color="#1f9d55" />
                              : f.status === 'error' ? <X size={16} color="#ef4444" />
                              : f.status === 'ocr' ? <ScanLine size={16} />
                              : f.status === 'nlp' ? <Brain size={16} />
                              : <FileText size={16} />}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.name}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
                              {f.size} · {STEPS[f.status]}
                            </Typography>
                            <LinearProgress variant="determinate" value={f.progress}
                              sx={{
                                height: 4, mt: 0.6, borderRadius: 2,
                                bgcolor: 'rgba(0,0,0,0.06)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: f.status === 'done' ? '#1f9d55' : f.status === 'error' ? '#ef4444' : '#FF7900'
                                }
                              }} />
                          </Box>
                          <IconButton size="small" onClick={e => { e.stopPropagation(); setItems(p => p.filter(x => x.id !== f.id)); }}>
                            <X size={13} />
                          </IconButton>
                        </Box>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </Box>
            </Box>
          </Grid>

          {/* Live console + extracted */}
          <Grid item xs={12} md={8}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid rgba(17,20,24,0.07)', overflow: 'hidden' }}>
              {active ? (
                <>
                  <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(17,20,24,0.05)' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 15 }}>{active.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                        {STEPS[active.status]} · {Math.round(active.progress)}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.6 }}>
                      {STEP_ORDER.slice(1).map(s => {
                        const idx = STEP_ORDER.indexOf(s);
                        const curIdx = STEP_ORDER.indexOf(active.status);
                        const done = curIdx > idx || active.status === 'done';
                        const current = curIdx === idx;
                        return (
                          <Box key={s} sx={{
                            height: 6, width: 38, borderRadius: 3,
                            background: done ? '#1f9d55' : current ? '#FF7900' : 'rgba(17,20,24,0.08)',
                            transition: 'all .3s',
                          }} />
                        );
                      })}
                    </Box>
                  </Box>

                  <Grid container>
                    {/* Console */}
                    <Grid item xs={12} md={6} sx={{ borderRight: { md: '1px solid rgba(17,20,24,0.05)' } }}>
                      <Box sx={{
                        background: '#0f1115', color: '#a8e6b5',
                        fontFamily: "'Fira Code', ui-monospace, monospace", fontSize: 12,
                        p: 2, minHeight: 320, maxHeight: 420, overflowY: 'auto',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#7eaaff' }}>
                          <Cpu size={13} /> <span>recrutia@pipeline:~$</span>
                        </Box>
                        <AnimatePresence initial={false}>
                          {active.logs.map((l, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                              <Box component="span" sx={{ color: '#5a6573', mr: 1 }}>{l.t}</Box>
                              <span>{l.line}</span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {active.status !== 'done' && active.status !== 'error' && (
                          <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                            style={{ display: 'inline-block', marginTop: 6 }}>▌</motion.span>
                        )}
                      </Box>
                    </Grid>

                    {/* Extracted fields */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2.5 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em', mb: 1.5 }}>
                          DONNÉES EXTRAITES
                        </Typography>
                        <ExtractedField icon={<FileText size={14} />} label="Nom" value={active.extracted.name} />
                        <ExtractedField icon={<Mail size={14} />} label="Email" value={active.extracted.email} />
                        <ExtractedField icon={<GraduationCap size={14} />} label="Diplôme" value={active.extracted.degree} />
                        <ExtractedField icon={<Briefcase size={14} />} label="Expérience" value={active.extracted.experience} />

                        <Box sx={{ mt: 1.4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8, color: '#6b7280' }}>
                            <Code2 size={14} />
                            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Compétences détectées</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, minHeight: 28 }}>
                            <AnimatePresence>
                              {active.extracted.skills.map(s => (
                                <motion.div key={s} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
                                  <Chip label={s} size="small" sx={{ background: 'rgba(255,121,0,0.10)', color: '#FF7900', fontWeight: 600 }} />
                                </motion.div>
                              ))}
                            </AnimatePresence>
                            {active.extracted.skills.length === 0 && (
                              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>—</Typography>
                            )}
                          </Box>
                        </Box>

                        {active.status === 'done' && (
                          <Box sx={{
                            mt: 2.4, p: 1.8, borderRadius: 2,
                            background: 'rgba(31,157,85,0.08)', border: '1px solid rgba(31,157,85,0.25)',
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Trophy size={16} color="#1f9d55" />
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1f9d55' }}>
                                Candidat enregistré avec succès
                              </Typography>
                            </Box>
                            <Button
                              size="small" fullWidth
                              onClick={() => navigate('/candidates')}
                              sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600, color: '#1f9d55' }}
                            >
                              Voir dans la liste des candidats →
                            </Button>
                          </Box>
                        )}

                        {active.status === 'error' && (
                          <Box sx={{
                            mt: 2.4, p: 1.8, borderRadius: 2,
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                          }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                              Échec de l'analyse — vérifiez le fichier
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </>
              ) : (
                <Box sx={{ p: 6, textAlign: 'center', color: '#6b7280' }}>
                  Sélectionnez un fichier pour voir le pipeline en direct.
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

function ExtractedField({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.7 }}>
      <Box sx={{ color: '#6b7280' }}>{icon}</Box>
      <Typography sx={{ fontSize: 12, color: '#6b7280', minWidth: 90 }}>{label}</Typography>
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div key={value} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{value}</Typography>
          </motion.div>
        ) : (
          <Box sx={{ height: 10, width: 110, borderRadius: 5, background: 'rgba(17,20,24,0.06)', overflow: 'hidden', position: 'relative' }}>
            <motion.div animate={{ x: ['-60%', '120%'] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,121,0,0.5), transparent)', width: '60%' }} />
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}