import { useNavigate, Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { motion } from 'motion/react';

export function AccessDenied() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[60vh] flex items-center justify-center px-4"
    >
      <div className="text-center max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <ShieldX className="w-10 h-10 text-red-500" />
        </motion.div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Access Denied</h1>
        <p className="text-slate-500 mb-2 leading-relaxed">
          You don't have permission to access this project.
        </p>
        <p className="text-slate-400 text-sm mb-8">
          Please contact the project owner to request access.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
          <Link to="/projects">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white w-full">
              Browse Projects
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
