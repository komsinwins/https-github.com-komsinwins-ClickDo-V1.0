/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Customer } from './types';

// Standard project contact positions
export const DEFAULT_POSITIONS = [
  'โปรเจ็คเมเนเจอร์ (PM)',
  'วิศวกรควบคุมงาน (Site Engineer)',
  'หัวหน้าช่างติดตั้ง (Foreman)',
  'เจ้าหน้าที่ความปลอดภัย (Safety Officer)',
  'ผู้ประสานงานโครงการ (Coordinator)',
  'ผู้แทนฝั่งเจ้าของงาน (Owner Representative)',
  'ผู้ตรวจสอบระบบ (Inspector)',
];

export const DEFAULT_STATUSES = [
  'Active',
  'On Hold',
  'Closed',
];

export const DEFAULT_SALESPEOPLE = [
  'นพพล รักดี',
  'วิภาดา แก้วมณี',
  'สมชาย สายลม',
  'อัญชลี ศรีสุข',
];

export const DEFAULT_PROJECT_MANAGERS = [
  'ธีรเดช เลิศศิริกุล',
  'ประดิษฐ์ มั่นคง',
  'ปรีชา วงศ์สุวรรณ',
  'สมยศ ชูประดิษฐ์',
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'demo-solar-roof-100kw',
    name: 'โครงการติดตั้ง Solar Roof & Energy Storage 100kW',
    status: 'Active',
    installationSite: 'โรงงานอมตะนคร ชลบุรี อาคาร B (เฟส 2)',
    startDate: '2026-07-01',
    endDate: '2026-07-15', // 5 days left from July 10, 2026! Triggers warning
    durationDays: 14,
    ownerName: 'บริษัท อมตะ ยูทิลิตี้ส์ จำกัด (มหาชน)',
    partnerCompany: 'บริษัท นีโอ เอนเนอร์ยี่ ซิสเต็มส์ จำกัด',
    salesPerson: 'นพพล รักดี',
    projectManager: 'ธีรเดช เลิศศิริกุล',
    contacts: [
      {
        id: 'contact-1',
        firstName: 'กฤษณะ',
        lastName: 'วรพจน์',
        position: 'ผู้แทนฝั่งเจ้าของงาน (Owner Representative)',
      },
      {
        id: 'contact-2',
        firstName: 'สมยศ',
        lastName: 'ชูประดิษฐ์',
        position: 'วิศวกรควบคุมงาน (Site Engineer)',
      },
      {
        id: 'contact-3',
        firstName: 'ร้อยเอก ณรงค์',
        lastName: 'พรมทอง',
        position: 'เจ้าหน้าที่ความปลอดภัย (Safety Officer)',
      },
    ],
    contractor: {
      teamName: 'ทีมช่างชัย โซล่าเซลล์ ดีไซน์',
      foremanName: 'สุรชัย ศรีสวัสดิ์',
      workers: [
        { id: 'worker-1', name: 'มานิต สว่างพรม' },
        { id: 'worker-2', name: 'สมบัติ ใจดี' },
        { id: 'worker-3', name: 'อุดม คำแก้ว' },
        { id: 'worker-4', name: 'วิชัย มั่นคง' },
        { id: 'worker-5', name: 'เกรียงไกร ชูเกียรติ' },
      ],
      totalWage: 120000,
      installments: [
        {
          id: 'inst-1',
          name: 'งวดที่ 1: มัดจำก่อนเริ่มงาน 30%',
          amount: 36000,
          percentage: 30,
          status: 'Paid',
        },
        {
          id: 'inst-2',
          name: 'งวดที่ 2: ดำเนินการติดตั้งแผงและระบบเคเบิล 40%',
          amount: 48000,
          percentage: 40,
          status: 'Paid',
        },
        {
          id: 'inst-3',
          name: 'งวดที่ 3: งานเชื่อมต่ออินเวอร์เตอร์และทดสอบระบบ 30%',
          amount: 36000,
          percentage: 30,
          status: 'Unpaid',
        },
      ],
    },
    scopesOfWork: [
      {
        id: 'sow-1',
        taskName: 'ติดตั้งโครงสร้างอลูมิเนียมสำหรับยึดแผงโซลาร์ (Mounting)',
        description: 'ติดตั้งโครงสร้างอลูมิเนียมบนหลังคาเมทัลชีท พร้อมทำระบบกันซึม Water-proof ทุกจุดเจาะ',
        status: 'Completed',
        progress: 100,
        startDate: '2026-07-01',
        endDate: '2026-07-04',
        assignee: 'ทีมช่างชัย โซล่าเซลล์ ดีไซน์',
      },
      {
        id: 'sow-2',
        taskName: 'ลำเลียงและจัดวางแผงโซลาร์เซลล์ (Solar Module Layout)',
        description: 'ขนย้ายแผงโซลาร์เซลล์ Mono-crystalline 550W จำนวน 182 แผง ขึ้นบนหลังคาอย่างปลอดภัยและติดตั้งยึดเข้าโครงสร้าง',
        status: 'Completed',
        progress: 100,
        startDate: '2026-07-05',
        endDate: '2026-07-08',
        assignee: 'ทีมช่างชัย โซล่าเซลล์ ดีไซน์',
      },
      {
        id: 'sow-3',
        taskName: 'เชื่อมต่อสายไฟ AC/DC และร้อยท่อเหล็ก EMT/IMC',
        description: 'เดินสายไฟ DC จากสายแผงโซลาร์เข้าสู่ตู้ Combiner Box และเดินสาย AC ออกจาก Inverter ไปยังตู้เมน MDB',
        status: 'In Progress',
        progress: 80,
        startDate: '2026-07-09',
        endDate: '2026-07-12',
        assignee: 'สมยศ ชูประดิษฐ์',
      },
      {
        id: 'sow-4',
        taskName: 'เชื่อมต่อและโปรแกรมตู้ควบคุม Energy Storage System (ESS)',
        description: 'ติดตั้งระบบควบคุมแบตเตอรี่สำรองขนาด 50kWh เชื่อมต่อสัญญาณควบคุมระบบ Smart EMS',
        status: 'Not Started',
        progress: 10,
        startDate: '2026-07-12',
        endDate: '2026-07-14',
        assignee: 'ธีรเดช เลิศศิริกุล',
      },
      {
        id: 'sow-5',
        taskName: 'ทดสอบการทำงานระบบขนานไฟ (Commissioning) และส่งมอบ',
        description: 'รันระบบเพื่อวัดค่าแรงดัน, กระแสไฟ และทดสอบระบบฟังก์ชั่น Zero-Export เพื่อขออนุมัติใช้งาน',
        status: 'Not Started',
        progress: 0,
        startDate: '2026-07-14',
        endDate: '2026-07-15',
        assignee: 'ธีรเดช เลิศศิริกุล',
      },
    ],
    orders: [
      {
        id: 'ord-1',
        itemName: 'แผงโซลาร์เซลล์ Trina Solar 550W Mono',
        sku: 'TSM-DE19-550W',
        qty: 182,
        unitPrice: 4200,
        supplier: 'ไทยโซลาร์เทค พาร์ทเนอร์ จำกัด',
        status: 'Delivered',
      },
      {
        id: 'ord-2',
        itemName: 'Inverter Huawei 100kW Smart String',
        sku: 'SUN2000-100KTL-M1',
        qty: 1,
        unitPrice: 145000,
        supplier: 'หัวเว่ย เทคโนโลยีส์ (ประเทศไทย)',
        status: 'Delivered',
      },
      {
        id: 'ord-3',
        itemName: 'สายไฟ DC Solar Cable PV1-F 4mm² (สีดำและสีแดง)',
        sku: 'PV1-F-4MM-R/B',
        qty: 4, // 4 rolls
        unitPrice: 4500,
        supplier: 'สยาม คอนดักเตอร์ แอนด์ เคเบิลส์',
        status: 'Delivered',
      },
      {
        id: 'ord-4',
        itemName: 'แบตเตอรี่สำรองลิเธียมฟอสเฟต LFP ESS 50kWh',
        sku: 'ESS-LFP-50KWH-L',
        qty: 1,
        unitPrice: 480000,
        supplier: 'พลังงานสะอาดไทย โฮลดิ้ง',
        status: 'Ordered',
      },
    ],
    diagrams: [
      {
        id: 'diagram-1',
        title: 'โครงร่างการจัดวางตู้ควบคุมและตู้ Combiner ในห้องหม้อแปลง',
        type: 'Placement',
        canvasData: '', // To be updated if user edits or draws
      },
      {
        id: 'diagram-2',
        title: 'Diagram การเชื่อมต่อวงจร DC Strings & AC Combiner Box',
        type: 'Connection',
        canvasData: '',
      }
    ],
    reports: [
      {
        id: 'rep-1',
        type: 'Daily',
        date: '2026-07-02',
        title: 'รายงานการปรับระดับหลังคาและเริ่มวางแนวอลูมิเนียม',
        details: 'ทำการเจาะรูบนหลังคาเมทัลชีทและทำการติดตั้ง L-Feet แถวที่ 1-5 พร้อมทากาวซีลกันซึมคุณภาพสูง ยึดแน่นหนาทนพายุ พนักงานใส่เข็มขัดกันตกทุกคน ปลอดภัยดีเยี่ยม',
        photos: [],
        reporter: 'สุรชัย ศรีสวัสดิ์',
      },
      {
        id: 'rep-2',
        type: 'Weekly',
        date: '2026-07-05',
        weekRange: 'สัปดาห์ที่ 1 (1 ก.ค. - 7 ก.ค. 2026)',
        title: 'สรุปการติดตั้งโครงสร้างและทยอยนำแผงขึ้นหลังคาอาคาร B',
        details: 'งานติดตั้งโครงสร้างอลูมิเนียมเสร็จสิ้น 100% งานยึดแผงโซลาร์เสร็จไปแล้วประมาณ 90 แผง ตรวจเช็คสายดินของโครงสร้างทั้งหมดได้ค่าโอห์มผ่านตามมาตรฐานการไฟฟ้านครหลวง',
        photos: [],
        reporter: 'สมยศ ชูประดิษฐ์',
      }
    ],
    documents: [
      {
        id: 'doc-1',
        title: 'ใบเสนอราคาติดตั้งโครงการ Solar Roof คณะผู้บริหารอนุมัติ',
        type: 'Quotation',
        fileName: 'Quotation_SolarRoof_Amata_100kW_Approved.pdf',
        fileSize: '2.4 MB',
        uploadedAt: '2026-06-15 10:30',
      },
      {
        id: 'doc-2',
        title: 'สัญญาว่าจ้างและมาตรฐานการปฏิบัติงานก่อสร้างโครงการติดตั้ง',
        type: 'Contract',
        fileName: 'Contract_EPC_Amata_AmataUtilities_Signed.pdf',
        fileSize: '4.8 MB',
        uploadedAt: '2026-06-20 14:15',
      }
    ],
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-amata',
    companyName: 'บริษัท อมตะ ยูทิลิตี้ส์ จำกัด (มหาชน)',
    contactPerson: 'กฤษณะ วรพจน์ (ผู้จัดการฝ่ายวิศวกรรม)',
    phone: '081-234-5678',
    email: 'krishna.w@amata-utility.com',
    address: '700/77 หมู่ 1 นิคมอุตสาหกรรมอมตะนคร ถนนบางนา-ตราด กม.57 ต.คลองตำหรุ อ.เมือง จ.ชลบุรี 20000',
    industry: 'พลังงานและสาธารณูปโภค',
    taxId: '0107555000123',
    notes: 'ลูกค้าโครงการติดตั้ง Solar Roof ขนาด 100kW (อาคาร B) ประสานงานดีเยี่ยม ชำระเงินตรงเวลา',
  },
  {
    id: 'cust-cpall',
    companyName: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
    contactPerson: 'สมศักดิ์ มั่งคั่ง (ผู้อำนวยการจัดซื้อภายนอก)',
    phone: '089-876-5432',
    email: 'somsak.man@cpall.co.th',
    address: '313 อาคาร ซี.พี.ทาวเวอร์ ชั้น 24 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500',
    industry: 'ค้าปลีก / บริการ',
    taxId: '0107542000011',
    notes: 'อยู่ระหว่างเสนอราคาโครงการติดตั้ง Solar Carport ลานจอดรถสำนักงานใหญ่',
  },
  {
    id: 'cust-thaibev',
    companyName: 'บริษัท ไทยเบฟเวอเรจ จำกัด (มหาชน)',
    contactPerson: 'วิภา แก้วมณี (ผู้ประสานงานจัดซื้อส่วนเทคโนโลยีสิ่งแวดล้อม)',
    phone: '085-555-1234',
    email: 'wipa.k@thaibev.com',
    address: '14 ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900',
    industry: 'อาหารและเครื่องดื่ม',
    taxId: '0107546000321',
    notes: 'ลูกค้าเก่า สนใจทำโครงการประหยัดพลังงานไฟฟ้าระบบ Solar Rooftop โรงงานผลิตเฟสใหม่',
  }
];

