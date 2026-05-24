import { useNotifications } from '@/contexts/NotificationContext';
import { storage } from '@/lib/storage';

export function useNotificationTriggers() {
  const { addNotification } = useNotifications();

  const notifyNewAssignment = (assignmentTitle: string, classId: string, type: 'homework' | 'exam') => {
    // Notify all students in the class and their parents
    const students = storage.getStudents().filter(s => s.classId === classId);
    const users = storage.getUsers();
    
    students.forEach(student => {
      // Find student user
      const studentUser = users.find(u => u.studentId === student.id && u.role === 'student');
      if (studentUser) {
        addNotification({
          userId: studentUser.id,
          type: 'assignment',
          title: type === 'exam' ? 'Nouvel examen' : 'Nouveau devoir',
          message: `${assignmentTitle} a été ajouté à votre classe.`,
        });
      }
      
      // Find parent user
      const parentUser = users.find(u => u.studentId === student.id && u.role === 'parent');
      if (parentUser) {
        addNotification({
          userId: parentUser.id,
          type: 'assignment',
          title: type === 'exam' ? 'Nouvel examen' : 'Nouveau devoir',
          message: `${assignmentTitle} a été assigné à ${student.name}.`,
        });
      }
    });
  };

  const notifyNewGrade = (studentId: string, subjectName: string, value: number, maxValue: number) => {
    const users = storage.getUsers();
    const student = storage.getStudents().find(s => s.id === studentId);
    
    // Notify student
    const studentUser = users.find(u => u.studentId === studentId && u.role === 'student');
    if (studentUser) {
      addNotification({
        userId: studentUser.id,
        type: 'grade',
        title: 'Nouvelle note',
        message: `Vous avez reçu ${value}/${maxValue} en ${subjectName}.`,
      });
    }
    
    // Notify parent
    const parentUser = users.find(u => u.studentId === studentId && u.role === 'parent');
    if (parentUser && student) {
      addNotification({
        userId: parentUser.id,
        type: 'grade',
        title: 'Nouvelle note',
        message: `${student.name} a reçu ${value}/${maxValue} en ${subjectName}.`,
      });
    }
  };

  const notifyAbsence = (studentId: string, date: string) => {
    const users = storage.getUsers();
    const student = storage.getStudents().find(s => s.id === studentId);
    
    // Notify parent
    const parentUser = users.find(u => u.studentId === studentId && u.role === 'parent');
    if (parentUser && student) {
      addNotification({
        userId: parentUser.id,
        type: 'attendance',
        title: 'Absence signalée',
        message: `${student.name} a été marqué absent le ${date}.`,
      });
    }
  };

  const notifyNewResource = (resourceName: string, classId?: string) => {
    const users = storage.getUsers();
    
    if (classId) {
      // Notify students in that class
      const students = storage.getStudents().filter(s => s.classId === classId);
      students.forEach(student => {
        const studentUser = users.find(u => u.studentId === student.id && u.role === 'student');
        if (studentUser) {
          addNotification({
            userId: studentUser.id,
            type: 'resource',
            title: 'Nouvelle ressource',
            message: `Le document "${resourceName}" est disponible.`,
          });
        }
      });
    }
  };

  return {
    notifyNewAssignment,
    notifyNewGrade,
    notifyAbsence,
    notifyNewResource,
  };
}
