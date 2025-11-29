import mpl from '@metaplex-foundation/mpl-token-metadata';
console.log('mpl default keys:', Object.keys(mpl as any));
// @ts-ignore
console.log('Named export keys:', Object.keys((mpl as any)?.default ?? {}));
console.log('Has createCreateMetadataAccountV3Instruction:', typeof (mpl as any).createCreateMetadataAccountV3Instruction);
console.log('Has createUpdateMetadataAccountV2Instruction:', typeof (mpl as any).createUpdateMetadataAccountV2Instruction);
console.log('Has findMetadataPda:', typeof (mpl as any).findMetadataPda);
console.log('Keys like *CreateMetadata*:', Object.keys(mpl as any).filter((k) => k.toLowerCase().includes('createmetadata')));
console.log('Has mplTokenMetadata plugin:', typeof (mpl as any).mplTokenMetadata);
console.log('Keys like *updateMetadataAccountV2*:', Object.keys(mpl as any).filter((k) => k.toLowerCase().includes('updatemetadataaccountv2')));