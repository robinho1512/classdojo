import React, { useState } from 'react';
import { Shield, KeyRound, Users, GraduationCap, Award } from 'lucide-react';
import { UserRole } from '../types';

interface LoginModalProps {
  onLogin: (role: UserRole, userEmail: string) => void;
  userEmail: string;
}

export default function LoginModal({ onLogin, userEmail }: LoginModalProps) {
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('aluno@escola.com');

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'teacher') {
      setEmail('ricardo.silva@escola.com');
    } else if (selectedRole === 'parent') {
      setEmail('joaopedro.joaopedro12345678910@gmail.com');
    } else if (selectedRole === 'admin') {
      setEmail('admin@escola.com');
    } else {
      setEmail('aluno@escola.com');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(role, email);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0b]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="login-modal-container">
      <div className="bg-[#141416] border border-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Decorative gold accent header */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#c4a47c] via-[#b09069] to-[#c4a47c]"></div>

        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#c4a47c]/10 flex items-center justify-center text-[#c4a47c] mb-4 border border-[#c4a47c]/25">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-serif-cormorant font-bold text-slate-100 tracking-wide">EduClass Dojo</h2>
          <p className="text-slate-400 text-sm mt-1.5">Escolha seu perfil para acessar o portal instantaneamente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Selecione o seu Perfil
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`py-3 px-2 text-xs font-semibold rounded-xl border flex flex-col items-center gap-2 transition ${
                  role === 'student'
                    ? 'bg-[#c4a47c]/15 border-[#c4a47c] text-[#c4a47c]'
                    : 'bg-[#1e1e21] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
                <span>Aluno</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('teacher')}
                className={`py-3 px-2 text-xs font-semibold rounded-xl border flex flex-col items-center gap-2 transition ${
                  role === 'teacher'
                    ? 'bg-[#c4a47c]/15 border-[#c4a47c] text-[#c4a47c]'
                    : 'bg-[#1e1e21] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Professor</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('parent')}
                className={`py-3 px-2 text-xs font-semibold rounded-xl border flex flex-col items-center gap-2 transition ${
                  role === 'parent'
                    ? 'bg-[#c4a47c]/15 border-[#c4a47c] text-[#c4a47c]'
                    : 'bg-[#1e1e21] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Responsável</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`py-3 px-2 text-xs font-semibold rounded-xl border flex flex-col items-center gap-2 transition ${
                  role === 'admin'
                    ? 'bg-[#c4a47c]/15 border-[#c4a47c] text-[#c4a47c]'
                    : 'bg-[#1e1e21] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <KeyRound className="w-5 h-5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Identificação (E-mail ou Usuário)</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#1e1e21] text-slate-100 text-sm focus:outline-none focus:border-[#c4a47c] transition"
                placeholder="exemplo@escola.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#c4a47c] hover:bg-[#b09069] text-[#0a0a0b] font-bold rounded-xl shadow-lg shadow-[#c4a47c]/10 transition duration-300 text-sm flex items-center justify-center gap-2"
          >
            Acessar Dojo
          </button>
        </form>
      </div>
    </div>
  );
}
