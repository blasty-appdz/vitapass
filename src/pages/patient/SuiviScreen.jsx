import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../../components/common/Modal'
import MiniChart from '../../components/common/MiniChart'

export default function SuiviScreen({ nav, dossier, onSave, showToast }) {
  const { t } = useTranslation()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})

  const glyc = dossier?.glyc || []
  const bp = dossier?.bp || []
  const weight = dossier?.weight || []
  const lastGlyc = glyc.length > 0 ? glyc[glyc.length - 1] : null
  const lastBp = bp.length > 0 ? bp[bp.length - 1] : null
  const lastW = weight.length > 0 ? weight[weight.length - 1] : null
  const today = new Date().toISOString().split('T')[0]

  const saveMetric = async () => {
    if (modal === 'glyc') {
      const v = parseFloat(form.val)
      if (!v) return
      await onSave({ glyc: [...glyc, v].slice(-7) })
    } else if (modal === 'bp') {
      const s = parseInt(form.s), d = parseInt(form.d)
      if (!s || !d) return
      await onSave({ bp: [...bp, { s, d }].slice(-7) })
    } else if (modal === 'weight') {
      const v = parseFloat(form.val)
      if (!v) return
      await onSave({ weight: [...weight, v].slice(-7) })
    }
    setModal(null)
    setForm({})
    showToast('✅')
  }

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('home')}>←</div>
        <div className="shdr-title">{t('home.suivi_title')}</div>
      </div>

      <div className="metric-card" onClick={() => { setModal('glyc'); setForm({ date: today }) }}>
        <div className="mc-hdr">
          <div className="mc-left">
            <span style={{ fontSize: 22 }}>{"🩸"}</span>
            <div>
              <div className="mc-title">{"Glycémie (HbA1c)"}</div>
              <div className="mc-sub">{"+ " + t('common.add')}</div>
            </div>
          </div>
          <div>
            <span className="mc-val">{lastGlyc ?? '--'}</span>
            <span className="mc-unit"> %</span>
          </div>
        </div>
        <MiniChart data={glyc} />
        <div className={`mc-trend${lastGlyc && lastGlyc >= 7.5 ? ' warn' : ''}`}>
          {lastGlyc ? (lastGlyc < 7.5 ? '↓ OK' : '↗️ Élevé') : '+ ' + t('common.add')}
        </div>
      </div>

      <div className="metric-card" onClick={() => { setModal('bp'); setForm({ date: today }) }}>
        <div className="mc-hdr">
          <div className="mc-left">
            <span style={{ fontSize: 22 }}>{"❤️"}</span>
            <div>
              <div className="mc-title">{"Tension artérielle"}</div>
              <div className="mc-sub">mmHg</div>
            </div>
          </div>
          <div>
            <span className="mc-val">{lastBp ? lastBp.s : '--'}</span>
            <span className="mc-unit">{lastBp ? '/' + lastBp.d : ''}</span>
          </div>
        </div>
        <MiniChart data={bp.map(b => b.s)} />
        <div className={`mc-trend${lastBp && lastBp.s > 130 ? ' warn' : ''}`}>
          {lastBp ? (lastBp.s > 130 ? '↗️ Élevé' : '↓ Normal') : '+ ' + t('common.add')}
        </div>
      </div>

      <div className="metric-card" onClick={() => { setModal('weight'); setForm({ date: today }) }}>
        <div className="mc-hdr">
          <div className="mc-left">
            <span style={{ fontSize: 22 }}>{"⚖️"}</span>
            <div>
              <div className="mc-title">Poids</div>
              <div className="mc-sub">kg</div>
            </div>
          </div>
          <div>
            <span className="mc-val">{lastW ?? '--'}</span>
            <span className="mc-unit"> kg</span>
          </div>
        </div>
        <MiniChart data={weight} />
        <div className="mc-trend">
          {lastW && weight.length > 1
            ? `${weight[0] > lastW ? '↓' : '↑'} ${Math.abs(weight[0] - lastW).toFixed(1)}kg`
            : '+ ' + t('common.add')}
        </div>
      </div>

      <div className="pad-b" />

      {modal === 'glyc' && (
        <Modal title="Glycémie" onClose={() => setModal(null)}>
          <div className="form-group">
            <label className="form-label">%</label>
            <input className="form-input" type="number" step="0.1" placeholder="7.2" onChange={e => setForm({ ...form, val: e.target.value })} />
          </div>
          <button className="btn-submit" onClick={saveMetric}>{t('common.save')}</button>
          <button className="btn-cancel" onClick={() => setModal(null)}>{t('common.cancel')}</button>
        </Modal>
      )}
      {modal === 'bp' && (
        <Modal title="Tension" onClose={() => setModal(null)}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sys.</label>
              <input className="form-input" type="number" placeholder="128" onChange={e => setForm({ ...form, s: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Dias.</label>
              <input className="form-input" type="number" placeholder="82" onChange={e => setForm({ ...form, d: e.target.value })} />
            </div>
          </div>
          <button className="btn-submit" onClick={saveMetric}>{t('common.save')}</button>
          <button className="btn-cancel" onClick={() => setModal(null)}>{t('common.cancel')}</button>
        </Modal>
      )}
      {modal === 'weight' && (
        <Modal title="Poids" onClose={() => setModal(null)}>
          <div className="form-group">
            <label className="form-label">kg</label>
            <input className="form-input" type="number" step="0.1" placeholder="82" onChange={e => setForm({ ...form, val: e.target.value })} />
          </div>
          <button className="btn-submit" onClick={saveMetric}>{t('common.save')}</button>
          <button className="btn-cancel" onClick={() => setModal(null)}>{t('common.cancel')}</button>
        </Modal>
      )}
    </div>
  )
}
