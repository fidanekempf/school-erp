import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { storage, Student, Grade, Assignment, AttendanceRecord, TimeSlot, Class, Resource } from '@/lib/storage';

export function useRoleBasedData() {
  const { user } = useAuth();

  const filteredData = useMemo(() => {
    const allStudents = storage.getStudents();
    const allGrades = storage.getGrades();
    const allAssignments = storage.getAssignments();
    const allAttendance = storage.getAttendance();
    const allTimeSlots = storage.getTimeSlots();
    const allClasses = storage.getClasses();
    const allResources = storage.getResources();

    if (!user) {
      return {
        students: [],
        grades: [],
        assignments: [],
        attendance: [],
        timeSlots: [],
        classes: [],
        resources: [],
        canEdit: false,
        canCreate: false,
      };
    }

    switch (user.role) {
      case 'administrator':
        return {
          students: allStudents,
          grades: allGrades,
          assignments: allAssignments,
          attendance: allAttendance,
          timeSlots: allTimeSlots,
          classes: allClasses,
          resources: allResources,
          canEdit: true,
          canCreate: true,
        };

      case 'professor': {
        // Get professor's subjects and classes from timeslots
        const professorTimeSlots = allTimeSlots.filter(ts => ts.professorId === user.professorId);
        const professorClassIds = [...new Set(professorTimeSlots.map(ts => ts.classId))];
        const professorSubjectIds = [...new Set(professorTimeSlots.map(ts => ts.subjectId))];
        
        // Students in professor's classes
        const professorStudents = allStudents.filter(s => professorClassIds.includes(s.classId));
        const professorStudentIds = professorStudents.map(s => s.id);
        
        return {
          students: professorStudents,
          grades: allGrades.filter(g => 
            g.professorId === user.professorId || professorStudentIds.includes(g.studentId)
          ),
          assignments: allAssignments.filter(a => 
            a.professorId === user.professorId || professorClassIds.includes(a.classId)
          ),
          attendance: allAttendance.filter(a => professorClassIds.includes(a.classId)),
          timeSlots: professorTimeSlots,
          classes: allClasses.filter(c => professorClassIds.includes(c.id)),
          resources: allResources.filter(r => 
            !r.classId || professorClassIds.includes(r.classId) ||
            !r.subjectId || professorSubjectIds.includes(r.subjectId)
          ),
          canEdit: true,
          canCreate: true,
        };
      }

      case 'student': {
        const student = allStudents.find(s => s.id === user.studentId);
        if (!student) {
          return {
            students: [],
            grades: [],
            assignments: [],
            attendance: [],
            timeSlots: [],
            classes: [],
            resources: [],
            canEdit: false,
            canCreate: false,
          };
        }
        
        const studentClass = allClasses.find(c => c.id === student.classId);
        
        return {
          students: [student],
          grades: allGrades.filter(g => g.studentId === user.studentId),
          assignments: allAssignments.filter(a => a.classId === student.classId),
          attendance: allAttendance.filter(a => a.studentId === user.studentId),
          timeSlots: allTimeSlots.filter(ts => ts.classId === student.classId),
          classes: studentClass ? [studentClass] : [],
          resources: allResources.filter(r => 
            !r.classId || r.classId === student.classId
          ),
          canEdit: false,
          canCreate: false,
        };
      }

      case 'parent': {
        const child = allStudents.find(s => s.id === user.studentId);
        if (!child) {
          return {
            students: [],
            grades: [],
            assignments: [],
            attendance: [],
            timeSlots: [],
            classes: [],
            resources: [],
            canEdit: false,
            canCreate: false,
          };
        }
        
        const childClass = allClasses.find(c => c.id === child.classId);
        
        return {
          students: [child],
          grades: allGrades.filter(g => g.studentId === user.studentId),
          assignments: allAssignments.filter(a => a.classId === child.classId),
          attendance: allAttendance.filter(a => a.studentId === user.studentId),
          timeSlots: allTimeSlots.filter(ts => ts.classId === child.classId),
          classes: childClass ? [childClass] : [],
          resources: allResources.filter(r => 
            !r.classId || r.classId === child.classId
          ),
          canEdit: false,
          canCreate: false,
        };
      }

      default:
        return {
          students: [],
          grades: [],
          assignments: [],
          attendance: [],
          timeSlots: [],
          classes: [],
          resources: [],
          canEdit: false,
          canCreate: false,
        };
    }
  }, [user]);

  return {
    ...filteredData,
    user,
    isAdmin: user?.role === 'administrator',
    isProfessor: user?.role === 'professor',
    isStudent: user?.role === 'student',
    isParent: user?.role === 'parent',
  };
}
