import React from 'react';
import Image from 'next/image';

const FormHeader: React.FC = () => {
  return (
    <h1 className="px-6 py-4 border-b border-gray-100 flex items-center">
      <div className="h-8 w-8 rounded-md flex items-center justify-center">
        <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
      </div>
      <div className="ml-3 text-xl font-medium text-gray-700">Withdraw</div>
    </h1>
  );
};

export default FormHeader; 