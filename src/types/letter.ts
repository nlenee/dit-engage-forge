export interface Signatory {
  id: string;
  name: string;
  title: string;
  signatureImage?: string;
}

export interface LetterData {
  id?: string;
  recipientName: string;
  recipientEmail: string;
  country: string;
  state: string;
  office: string;
  dateOfAssignment: Date;
  letterContent: string;
  signatories: Signatory[];
  createdAt?: Date;
  status?: 'draft' | 'sent' | 'downloaded';
}

export interface LetterFormData {
  recipientName: string;
  recipientEmail: string;
  country: string;
  state: string;
  office: string;
  dateOfAssignment: Date;
  letterContent: string;
  signatories: Signatory[];
}

export const defaultLetterContent = `Congratulations on your appointment as the [POSITION].

The appointment terms and conditions are stated below:

• Salary: There is currently no stipulated monetary benefit attached to the role.

• Working Hours: You are to choose your working hours and working days. Nevertheless, your presence will be required at all executive meetings both virtual and physical (meetings are currently almost always virtual).

• Appointment termination: The Executive Board (Board of Executive Directors) or the Chief Executive Director reserves the right to terminate this appointment should you violate any of these terms.

• Step Down or Resignation: You are to give a 3 month notice, if you desire to step-down or resign from the office of this appointment. In either case you are to present a candidate in your faction with potential to lead the faction effectively.

• Faction's Autonomy and Control: The appointed department remains an inseparable part of DIT and will always work alongside other factions towards achieving the big picture painted by DIT regardless of her level of autonomy. Therefore, the department is subject to the leadership (not forceful control) of DIT, today and in the future.

We are pleased that you accept this offer, and we hope to have an enjoyable walk together with you towards making our nation and continent a better place to be.`;
