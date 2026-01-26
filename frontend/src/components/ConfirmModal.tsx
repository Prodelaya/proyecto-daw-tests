// ============================================
// CONFIRM MODAL - Modal de confirmación reutilizable
// ============================================
// Reemplaza window.confirm() para mejor compatibilidad móvil

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    isLoading = false
}: ConfirmModalProps) {
    // No renderizar si está cerrado
    if (!isOpen) return null;

    return (
        // Overlay oscuro
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onCancel} // Cerrar al hacer clic fuera
        >
            {/* Modal */}
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all"
                onClick={(e) => e.stopPropagation()} // Evitar cerrar al hacer clic dentro
            >
                {/* Título */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                    {title}
                </h3>

                {/* Mensaje */}
                <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">
                    {message}
                </p>

                {/* Botones */}
                <div className="flex gap-3 justify-end">
                    {/* Botón Cancelar */}
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-lg font-semibold transition
                       bg-gray-200 dark:bg-gray-700 
                       text-gray-700 dark:text-gray-300
                       hover:bg-gray-300 dark:hover:bg-gray-600
                       disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>

                    {/* Botón Confirmar */}
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-lg font-semibold transition
                       bg-green-600 hover:bg-green-700 text-white
                       disabled:bg-gray-400 disabled:cursor-not-allowed
                       flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Enviando...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
