import {
  ArchitecturalOpening,
  AuditSeverity,
  ErgonomicAuditResult,
  ErgonomicFinding,
  LightingCalculation,
  PlacedFurniture,
  RoomConfig,
  RoomType,
} from '../types/room';

export interface RectBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getEffectiveBox(item: PlacedFurniture): RectBox {
  const isRotated = item.rotationDeg === 90 || item.rotationDeg === 270;
  return {
    x: item.xCm,
    y: item.yCm,
    w: isRotated ? item.depthCm : item.widthCm,
    h: isRotated ? item.widthCm : item.depthCm,
  };
}

export function getDoorSwingBox(opening: ArchitecturalOpening, roomWidthCm: number, roomLengthCm: number): RectBox {
  const w = opening.widthCm;
  switch (opening.wall) {
    case 'top':
      return { x: opening.offsetCm, y: 0, w, h: w };
    case 'bottom':
      return { x: opening.offsetCm, y: roomLengthCm - w, w, h: w };
    case 'left':
      return { x: 0, y: opening.offsetCm, w, h: w };
    case 'right':
      return { x: roomWidthCm - w, y: opening.offsetCm, w, h: w };
  }
}

function boxesOverlap(a: RectBox, b: RectBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function edgeDistance(a: RectBox, b: RectBox): number {
  const dx = Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)));
  const dy = Math.max(0, Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h)));
  return Math.round(Math.hypot(dx, dy));
}

export function calculateLightingSpec(roomType: RoomType, areaSqM: number): LightingCalculation {
  // Industry standard Lux / Lumens per m²:
  // Living/Bedroom: ~110-200 lm/m² ambient; Workspace/Kitchen: ~300-450 lm/m²
  const specMap: Record<
    RoomType,
    { minPerSqM: number; maxPerSqM: number; kelvin: string; taskShare: number; accentShare: number }
  > = {
    living: { minPerSqM: 120, maxPerSqM: 215, kelvin: '2700K – 3000K', taskShare: 0.25, accentShare: 0.15 },
    bedroom: { minPerSqM: 100, maxPerSqM: 180, kelvin: '2700K', taskShare: 0.3, accentShare: 0.15 },
    workspace: { minPerSqM: 320, maxPerSqM: 500, kelvin: '3500K – 4000K', taskShare: 0.45, accentShare: 0.1 },
    dining: { minPerSqM: 180, maxPerSqM: 280, kelvin: '2700K – 3000K', taskShare: 0.4, accentShare: 0.15 },
    studio: { minPerSqM: 160, maxPerSqM: 270, kelvin: '3000K', taskShare: 0.35, accentShare: 0.15 },
  };

  const s = specMap[roomType];
  const targetLumensMin = Math.round(areaSqM * s.minPerSqM);
  const targetLumensMax = Math.round(areaSqM * s.maxPerSqM);
  const recommendedLumens = Math.round((targetLumensMin + targetLumensMax) / 2);

  const taskLumens = Math.round(recommendedLumens * s.taskShare);
  const accentLumens = Math.round(recommendedLumens * s.accentShare);
  const ambientLumens = Math.max(0, recommendedLumens - taskLumens - accentLumens);

  // Modern LED efficacy ~95 lm/W
  const estimatedWattLed = Math.max(8, Math.round(recommendedLumens / 95));

  return {
    areaSqM,
    targetLumensMin,
    targetLumensMax,
    recommendedLumens,
    ambientLumens,
    taskLumens,
    accentLumens,
    kelvinRange: s.kelvin,
    estimatedWattLed,
  };
}

export function auditRoomErgonomics(room: RoomConfig): ErgonomicAuditResult {
  const areaSqM = Number(((room.widthCm * room.lengthCm) / 10000).toFixed(2));
  const solidItems = room.furniture.filter((f) => !f.isFloorOverlay);

  const occupiedCm2 = solidItems.reduce((sum, item) => {
    const box = getEffectiveBox(item);
    return sum + box.w * box.h;
  }, 0);

  const occupiedSqM = Number((occupiedCm2 / 10000).toFixed(2));
  const fillRatioPercent = areaSqM > 0 ? Math.round((occupiedSqM / areaSqM) * 100) : 0;

  let fillStatus: AuditSeverity = 'nominal';
  if (fillRatioPercent > 60 || fillRatioPercent < 12) {
    fillStatus = fillRatioPercent > 68 ? 'critical' : 'warning';
  }

  const findings: ErgonomicFinding[] = [];

  // 1. Check fill ratio rule (ideal 30% - 55%)
  if (fillRatioPercent > 58) {
    findings.push({
      id: 'fill-high',
      rule: 'Rasio Okupansi Lantai',
      severity: fillRatioPercent > 68 ? 'critical' : 'warning',
      measuredLabel: `${fillRatioPercent}% terisi`,
      standardLabel: '30% – 55%',
      message:
        'Kepadatan perabot melebihi batas ideal sehingga ruang sirkulasi terasa sempit. Pertimbangkan perabot berukuran lebih ringkas.',
      affectedIds: [],
    });
  } else if (solidItems.length > 0 && fillRatioPercent < 20) {
    findings.push({
      id: 'fill-low',
      rule: 'Rasio Okupansi Lantai',
      severity: 'warning',
      measuredLabel: `${fillRatioPercent}% terisi`,
      standardLabel: '30% – 55%',
      message:
        'Ruangan masih sangat lapang. Tambahkan zona fungsional atau karpet pemersatu agar skala ruang terasa proporsional.',
      affectedIds: [],
    });
  } else if (solidItems.length > 0) {
    findings.push({
      id: 'fill-ok',
      rule: 'Rasio Okupansi Lantai',
      severity: 'nominal',
      measuredLabel: `${fillRatioPercent}% terisi`,
      standardLabel: '30% – 55%',
      message: 'Proporsi antara luasan perabot dan area bebas sirkulasi sudah seimbang.',
      affectedIds: [],
    });
  }

  // 2. Boundary checks & overlaps
  for (let i = 0; i < solidItems.length; i++) {
    const a = solidItems[i];
    const boxA = getEffectiveBox(a);

    if (
      boxA.x < 0 ||
      boxA.y < 0 ||
      boxA.x + boxA.w > room.widthCm ||
      boxA.y + boxA.h > room.lengthCm
    ) {
      findings.push({
        id: `out-${a.id}`,
        rule: 'Batas Dinding Ruangan',
        severity: 'critical',
        measuredLabel: 'Keluar dinding',
        standardLabel: 'Di dalam batas',
        message: `${a.name} menembus garis batas dinding ruangan (${room.widthCm}×${room.lengthCm} cm).`,
        affectedIds: [a.id],
      });
    }

    for (let j = i + 1; j < solidItems.length; j++) {
      const b = solidItems[j];
      const boxB = getEffectiveBox(b);

      if (boxesOverlap(boxA, boxB)) {
        findings.push({
          id: `overlap-${a.id}-${b.id}`,
          rule: 'Deteksi Benturan Perabot',
          severity: 'critical',
          measuredLabel: 'Tumpang tindih',
          standardLabel: '0 cm overlap',
          message: `${a.name} bertabrakan dengan ${b.name}. Geser salah satu agar fungsi keduanya tidak terhalang.`,
          affectedIds: [a.id, b.id],
        });
      }
    }
  }

  // 3. Door swing obstruction
  const doors = room.openings.filter((o) => o.type === 'door');
  for (const door of doors) {
    const swing = getDoorSwingBox(door, room.widthCm, room.lengthCm);
    const blocking = solidItems.filter((item) => boxesOverlap(getEffectiveBox(item), swing));
    if (blocking.length > 0) {
      findings.push({
        id: `door-${door.id}`,
        rule: 'Radius Bukaan Pintu',
        severity: 'critical',
        measuredLabel: 'Terhalang',
        standardLabel: `Bebas ${door.widthCm} cm`,
        message: `Radius ayunan pintu terhalang oleh ${blocking.map((b) => b.name).join(', ')}.`,
        affectedIds: blocking.map((b) => b.id),
      });
    } else {
      findings.push({
        id: `door-ok-${door.id}`,
        rule: 'Radius Bukaan Pintu',
        severity: 'nominal',
        measuredLabel: `Bebas ${door.widthCm} cm`,
        standardLabel: `Bebas ≥ ${door.widthCm} cm`,
        message: 'Akses ayunan daun pintu bebas dari hambatan perabot.',
        affectedIds: [],
      });
    }
  }

  // 4. Sofa <-> Coffee Table ergonomic distance (ideal 35-50 cm) & 2/3 proportion
  const sofas = solidItems.filter((f) => f.catalogId.startsWith('sofa'));
  const coffeeTables = solidItems.filter((f) => f.catalogId === 'coffee-table');

  for (const sofa of sofas) {
    const boxSofa = getEffectiveBox(sofa);
    const sofaMainLen = Math.max(boxSofa.w, boxSofa.h);

    for (const table of coffeeTables) {
      const boxTable = getEffectiveBox(table);
      const dist = edgeDistance(boxSofa, boxTable);
      if (dist <= 130) {
        if (dist < 35) {
          findings.push({
            id: `sofa-ct-${sofa.id}-${table.id}`,
            rule: 'Jarak Sofa ke Meja Kopi',
            severity: 'warning',
            measuredLabel: `${dist} cm`,
            standardLabel: '35 – 45 cm',
            message: `Jarak ${table.name} terlalu rapat ke ${sofa.name} (${dist} cm); ruang kaki ideal minimal 35 cm.`,
            affectedIds: [sofa.id, table.id],
          });
        } else if (dist <= 55) {
          findings.push({
            id: `sofa-ct-ok-${sofa.id}-${table.id}`,
            rule: 'Jarak Sofa ke Meja Kopi',
            severity: 'nominal',
            measuredLabel: `${dist} cm`,
            standardLabel: '35 – 45 cm',
            message: `Jarak jangkau antara ${sofa.name} dan ${table.name} ergonomis (${dist} cm).`,
            affectedIds: [sofa.id, table.id],
          });
        } else {
          findings.push({
            id: `sofa-ct-far-${sofa.id}-${table.id}`,
            rule: 'Jarak Sofa ke Meja Kopi',
            severity: 'warning',
            measuredLabel: `${dist} cm`,
            standardLabel: '35 – 50 cm',
            message: `${table.name} berjarak ${dist} cm dari ${sofa.name}; terlalu jauh untuk dijangkau sambil duduk.`,
            affectedIds: [sofa.id, table.id],
          });
        }

        const tableMainLen = Math.max(boxTable.w, boxTable.h);
        const ratio = tableMainLen / sofaMainLen;
        if (ratio < 0.45 || ratio > 0.85) {
          findings.push({
            id: `ratio-ct-${table.id}`,
            rule: 'Proporsi Meja Kopi vs Sofa',
            severity: 'warning',
            measuredLabel: `${Math.round(ratio * 100)}% panjang sofa`,
            standardLabel: '55% – 75% (~2/3)',
            message: `Panjang ${table.name} (${tableMainLen} cm) sebaiknya sekitar 2/3 panjang ${sofa.name} (${sofaMainLen} cm).`,
            affectedIds: [sofa.id, table.id],
          });
        }
      }
    }
  }

  // 5. Sofa <-> TV Credenza viewing distance check
  const tvUnits = solidItems.filter((f) => f.catalogId === 'tv-credenza');
  for (const sofa of sofas) {
    for (const tv of tvUnits) {
      const dist = edgeDistance(getEffectiveBox(sofa), getEffectiveBox(tv));
      if (dist < 180) {
        findings.push({
          id: `tv-dist-${sofa.id}-${tv.id}`,
          rule: 'Jarak Pandang Sofa ke TV',
          severity: 'warning',
          measuredLabel: `${dist} cm`,
          standardLabel: '200 – 320 cm',
          message: `Jarak pandang ke ${tv.name} hanya ${dist} cm. Idealnya 200–320 cm untuk TV 50–65 inci.`,
          affectedIds: [sofa.id, tv.id],
        });
      } else {
        findings.push({
          id: `tv-dist-ok-${sofa.id}-${tv.id}`,
          rule: 'Jarak Pandang Sofa ke TV',
          severity: 'nominal',
          measuredLabel: `${dist} cm`,
          standardLabel: '200 – 320 cm',
          message: `Jarak pandang dari ${sofa.name} ke ${tv.name} nyaman (${dist} cm).`,
          affectedIds: [sofa.id, tv.id],
        });
      }
    }
  }

  // 6. Dining table clearance from walls (>= 90 cm where chairs sit)
  const diningTables = solidItems.filter((f) => f.catalogId.startsWith('dining-table'));
  for (const dt of diningTables) {
    const box = getEffectiveBox(dt);
    const minWallGap = Math.min(
      box.x,
      box.y,
      room.widthCm - (box.x + box.w),
      room.lengthCm - (box.y + box.h)
    );
    if (minWallGap < 85) {
      findings.push({
        id: `dining-gap-${dt.id}`,
        rule: 'Clearance Kursi Makan',
        severity: 'warning',
        measuredLabel: `${minWallGap} cm`,
        standardLabel: '≥ 90 cm',
        message: `Sisi ${dt.name} berjarak ${minWallGap} cm dari dinding; butuh minimal 90 cm untuk menarik kursi makan.`,
        affectedIds: [dt.id],
      });
    } else {
      findings.push({
        id: `dining-gap-ok-${dt.id}`,
        rule: 'Clearance Kursi Makan',
        severity: 'nominal',
        measuredLabel: `${minWallGap} cm`,
        standardLabel: '≥ 90 cm',
        message: `Ruang tarik kursi di sekitar ${dt.name} memadai (${minWallGap} cm).`,
        affectedIds: [dt.id],
      });
    }
  }

  // 7. Bed clearance (>= 60 cm side access)
  const beds = solidItems.filter((f) => f.category === 'bed');
  for (const bed of beds) {
    const box = getEffectiveBox(bed);
    const leftGap = box.x;
    const rightGap = room.widthCm - (box.x + box.w);
    const footGap = room.lengthCm - (box.y + box.h);
    const maxSideGap = Math.max(leftGap, rightGap);
    if (maxSideGap < 60) {
      findings.push({
        id: `bed-side-${bed.id}`,
        rule: 'Akses Samping Ranjang',
        severity: 'warning',
        measuredLabel: `${maxSideGap} cm`,
        standardLabel: '≥ 60 cm',
        message: `Akses di sisi ${bed.name} kurang dari 60 cm. Minimal satu sisi ranjang harus memiliki jalur ≥ 60 cm.`,
        affectedIds: [bed.id],
      });
    } else if (footGap < 75 && box.y < 60) {
      findings.push({
        id: `bed-foot-${bed.id}`,
        rule: 'Jalur Kaki Ranjang',
        severity: 'warning',
        measuredLabel: `${footGap} cm`,
        standardLabel: '≥ 75 cm',
        message: `Jarak di ujung kaki ${bed.name} hanya ${footGap} cm; standar jalur lewat minimal 75 cm.`,
        affectedIds: [bed.id],
      });
    } else {
      findings.push({
        id: `bed-ok-${bed.id}`,
        rule: 'Ergonomi Sirkulasi Ranjang',
        severity: 'nominal',
        measuredLabel: `${Math.min(leftGap, rightGap)} / ${maxSideGap} cm`,
        standardLabel: '≥ 60 cm',
        message: `Akses samping ${bed.name} memenuhi standar kenyamanan keluar-masuk ranjang.`,
        affectedIds: [bed.id],
      });
    }
  }

  // 8. Wardrobe clearance
  const wardrobes = solidItems.filter((f) => f.catalogId === 'wardrobe');
  for (const wr of wardrobes) {
    const box = getEffectiveBox(wr);
    const clearanceAvailable = Math.max(
      box.y,
      room.lengthCm - (box.y + box.h),
      box.x,
      room.widthCm - (box.x + box.w)
    );
    if (clearanceAvailable < 80) {
      findings.push({
        id: `wardrobe-${wr.id}`,
        rule: 'Clearance Bukaan Lemari',
        severity: 'warning',
        measuredLabel: `${clearanceAvailable} cm`,
        standardLabel: '≥ 80 cm',
        message: `Area depan ${wr.name} sempit; sisakan minimal 80 cm untuk bukaan pintu atau gunakan pintu geser.`,
        affectedIds: [wr.id],
      });
    }
  }

  const totalBudgetIdr = room.furniture.reduce((sum, item) => sum + item.priceIdr, 0);
  const lighting = calculateLightingSpec(room.roomType, areaSqM);

  const nominalCount = findings.filter((f) => f.severity === 'nominal').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;

  return {
    areaSqM,
    occupiedSqM,
    fillRatioPercent,
    fillStatus,
    totalBudgetIdr,
    lighting,
    findings,
    nominalCount,
    warningCount,
    criticalCount,
  };
}
