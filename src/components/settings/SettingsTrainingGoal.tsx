import React from 'react';
import { Target } from 'lucide-react';
import type { AppSettings } from '../../types';

interface SettingsTrainingGoalProps {
    settings: AppSettings;
    onChange: (field: keyof AppSettings, value: any) => void;
}

const SettingsTrainingGoal: React.FC<SettingsTrainingGoalProps> = ({ settings, onChange }) => {
    const goals = [
        { value: 'general_fitness', label: 'Allgemeine Fitness', description: 'Gesund bleiben und regelmäßig trainieren' },
        { value: 'weight_loss', label: 'Gewicht verlieren', description: 'Körperfett reduzieren bei moderater Intensität' },
        { value: 'increase_ftp', label: 'FTP steigern', description: 'Schwellenleistung durch intensive Intervalle erhöhen' },
        { value: 'build_endurance', label: 'Ausdauer aufbauen', description: 'Längere Belastungen durchhalten (Zone 2 Fokus)' },
        { value: 'improve_vo2max', label: 'VO2max verbessern', description: 'Maximale Sauerstoffaufnahme durch harte Intervalle steigern' },
        { value: 'build_base', label: 'Grundlagenausdauer aufbauen', description: 'Aerobe Basis für die Saison legen (Basisphase)' },
        { value: 'race_prep', label: 'Wettkampfvorbereitung', description: 'Spezifisches Training für ein Event' },
        { value: 'maintenance', label: 'Formerhaltung', description: 'Aktuelles Fitnesslevel halten' },
    ];

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                <Target className="w-5 h-5 text-indigo-500" />
                Trainingsziel
            </h3>
            <div>
                <label htmlFor="trainingGoal" className="block text-sm font-medium text-gray-600 mb-2">
                    Wähle dein aktuelles Hauptziel:
                </label>
                <select
                    id="trainingGoal"
                    data-testid="input-trainingGoal"
                    value={settings.trainingGoal}
                    onChange={(e) => onChange('trainingGoal', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    {goals.map(goal => (
                        <option key={goal.value} value={goal.value}>
                            {goal.label}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                    {goals.find(g => g.value === settings.trainingGoal)?.description}
                </p>
            </div>
            <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-gray-700">
                    💡 <strong>Tipp:</strong> Dein Trainingsziel beeinflusst die Coaching-Empfehlungen.
                    Du kannst es jederzeit ändern, wenn sich deine Prioritäten verschieben.
                </p>
            </div>
        </div>
    );
};

export default SettingsTrainingGoal;
